package com.meuprecificador.organizador

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.combinedClickable
import androidx.compose.foundation.ExperimentalFoundationApi
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Search
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.runtime.saveable.rememberSaveable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.asImageBitmap
import androidx.core.graphics.drawable.toBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.launch

class MainActivity : ComponentActivity() {

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContent {
            MaterialTheme(colorScheme = lightColorScheme()) {
                Surface(modifier = Modifier.fillMaxSize(), color = MaterialTheme.colorScheme.background) {
                    OrganizerApp()
                }
            }
        }
    }

    override fun onResume() {
        super.onResume()
        // Recarrega ao voltar para o app, caso tenha instalado/desinstalado algo.
        viewModel.refresh(applicationContext)
    }

    private val viewModel = AppListViewModel()

    @Composable
    private fun OrganizerApp() {
        val context = LocalContext.current
        LaunchedEffect(Unit) { viewModel.refresh(context) }

        val state by viewModel.state.collectAsState()
        var openCategory by rememberSaveable { mutableStateOf<String?>(null) }
        var query by rememberSaveable { mutableStateOf("") }

        when {
            state.loading -> LoadingScreen()
            openCategory != null -> {
                val cat = Category.valueOf(openCategory!!)
                CategoryScreen(
                    category = cat,
                    apps = state.apps.filter { it.category == cat },
                    onBack = { openCategory = null },
                    onLaunch = { AppRepository(context).launch(it.packageName) },
                    onLongPress = { AppRepository(context).openAppDetails(it.packageName) },
                )
            }
            else -> HomeScreen(
                apps = state.apps,
                query = query,
                onQueryChange = { query = it },
                onOpenCategory = { openCategory = it.name },
                onLaunch = { AppRepository(context).launch(it.packageName) },
                onLongPress = { AppRepository(context).openAppDetails(it.packageName) },
            )
        }
    }
}

private data class UiState(
    val loading: Boolean = true,
    val apps: List<InstalledApp> = emptyList(),
)

private class AppListViewModel {
    val state = MutableStateFlow(UiState())
    private val scope = kotlinx.coroutines.CoroutineScope(kotlinx.coroutines.Dispatchers.Main)

    fun refresh(context: android.content.Context) {
        scope.launch {
            state.value = state.value.copy(loading = true)
            val apps = AppRepository(context).loadInstalledApps()
            state.value = UiState(loading = false, apps = apps)
        }
    }
}

@Composable
private fun LoadingScreen() {
    Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
        Column(horizontalAlignment = Alignment.CenterHorizontally) {
            CircularProgressIndicator()
            Spacer(Modifier.height(12.dp))
            Text(stringResource(R.string.loading))
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun HomeScreen(
    apps: List<InstalledApp>,
    query: String,
    onQueryChange: (String) -> Unit,
    onOpenCategory: (Category) -> Unit,
    onLaunch: (InstalledApp) -> Unit,
    onLongPress: (InstalledApp) -> Unit,
) {
    val grouped: Map<Category, List<InstalledApp>> = remember(apps) {
        apps.groupBy { it.category }
    }
    val filtered: List<InstalledApp> = remember(apps, query) {
        if (query.isBlank()) emptyList()
        else apps.filter { it.label.contains(query, ignoreCase = true) }
    }

    Scaffold(
        topBar = {
            TopAppBar(title = { Text(stringResource(R.string.app_name)) })
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 12.dp)
        ) {
            OutlinedTextField(
                value = query,
                onValueChange = onQueryChange,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 8.dp),
                singleLine = true,
                leadingIcon = { Icon(Icons.Default.Search, contentDescription = null) },
                placeholder = { Text(stringResource(R.string.search_hint)) },
                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
            )

            if (query.isNotBlank()) {
                if (filtered.isEmpty()) {
                    Box(Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
                        Text(stringResource(R.string.empty_search))
                    }
                } else {
                    AppGrid(apps = filtered, onLaunch = onLaunch, onLongPress = onLongPress)
                }
            } else {
                FoldersGrid(grouped = grouped, onOpenCategory = onOpenCategory)
            }
        }
    }
}

@Composable
private fun FoldersGrid(
    grouped: Map<Category, List<InstalledApp>>,
    onOpenCategory: (Category) -> Unit,
) {
    val categoriesOrdered = Category.values().filter { (grouped[it]?.size ?: 0) > 0 }
    LazyVerticalGrid(
        columns = GridCells.Adaptive(minSize = 120.dp),
        contentPadding = PaddingValues(vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(12.dp),
        horizontalArrangement = Arrangement.spacedBy(12.dp),
    ) {
        items(categoriesOrdered, key = { it.name }) { cat ->
            FolderTile(
                category = cat,
                apps = grouped[cat].orEmpty(),
                onClick = { onOpenCategory(cat) },
            )
        }
    }
}

@Composable
private fun FolderTile(
    category: Category,
    apps: List<InstalledApp>,
    onClick: () -> Unit,
) {
    val context = LocalContext.current
    val resId = remember(category) {
        context.resources.getIdentifier(category.titleResName, "string", context.packageName)
    }
    val title = if (resId != 0) stringResource(resId) else category.name

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(containerColor = Color(0xFFF1F4F9)),
        shape = RoundedCornerShape(20.dp),
    ) {
        Column(Modifier.padding(12.dp)) {
            // Mini grade 2x2 com prévia dos ícones (estilo "pasta" do Android).
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .aspectRatio(1f)
                    .background(Color(0xFFE3E9F2), RoundedCornerShape(14.dp))
                    .padding(10.dp)
            ) {
                Column(verticalArrangement = Arrangement.spacedBy(6.dp)) {
                    repeat(2) { row ->
                        Row(
                            horizontalArrangement = Arrangement.spacedBy(6.dp),
                            modifier = Modifier.weight(1f)
                        ) {
                            repeat(2) { col ->
                                val idx = row * 2 + col
                                Box(
                                    modifier = Modifier
                                        .weight(1f)
                                        .fillMaxHeight(),
                                    contentAlignment = Alignment.Center,
                                ) {
                                    apps.getOrNull(idx)?.let { AppIcon(it, sizeDp = 36) }
                                }
                            }
                        }
                    }
                }
            }
            Spacer(Modifier.height(8.dp))
            Text(
                title,
                fontWeight = FontWeight.SemiBold,
                fontSize = 14.sp,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis,
            )
            Text(
                "${apps.size} apps",
                color = Color(0xFF5C6470),
                fontSize = 12.sp,
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CategoryScreen(
    category: Category,
    apps: List<InstalledApp>,
    onBack: () -> Unit,
    onLaunch: (InstalledApp) -> Unit,
    onLongPress: (InstalledApp) -> Unit,
) {
    val context = LocalContext.current
    val resId = context.resources.getIdentifier(category.titleResName, "string", context.packageName)
    val title = if (resId != 0) stringResource(resId) else category.name

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(title) },
                navigationIcon = {
                    IconButton(onClick = onBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Voltar")
                    }
                },
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(horizontal = 12.dp)
        ) {
            AppGrid(apps = apps, onLaunch = onLaunch, onLongPress = onLongPress)
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
@Composable
private fun AppGrid(
    apps: List<InstalledApp>,
    onLaunch: (InstalledApp) -> Unit,
    onLongPress: (InstalledApp) -> Unit,
) {
    LazyVerticalGrid(
        columns = GridCells.Adaptive(minSize = 84.dp),
        contentPadding = PaddingValues(vertical = 8.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp),
        horizontalArrangement = Arrangement.spacedBy(8.dp),
    ) {
        items(apps, key = { it.packageName }) { app ->
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier
                    .combinedClickableSafe(
                        onClick = { onLaunch(app) },
                        onLongClick = { onLongPress(app) },
                    )
                    .padding(6.dp)
            ) {
                AppIcon(app, sizeDp = 56)
                Spacer(Modifier.height(4.dp))
                Text(
                    app.label,
                    fontSize = 12.sp,
                    maxLines = 2,
                    textAlign = TextAlign.Center,
                    overflow = TextOverflow.Ellipsis,
                )
            }
        }
    }
}

@OptIn(ExperimentalFoundationApi::class)
private fun Modifier.combinedClickableSafe(
    onClick: () -> Unit,
    onLongClick: () -> Unit,
): Modifier = this.then(
    combinedClickable(
        onClick = onClick,
        onLongClick = onLongClick,
    )
)

@Composable
private fun AppIcon(app: InstalledApp, sizeDp: Int) {
    val bitmap = remember(app.packageName) {
        runCatching { app.icon.toBitmap().asImageBitmap() }.getOrNull()
    }
    if (bitmap != null) {
        androidx.compose.foundation.Image(
            bitmap = bitmap,
            contentDescription = app.label,
            modifier = Modifier.size(sizeDp.dp),
        )
    } else {
        Box(
            modifier = Modifier
                .size(sizeDp.dp)
                .background(Color(0xFFE0E0E0), RoundedCornerShape(8.dp))
        )
    }
}
