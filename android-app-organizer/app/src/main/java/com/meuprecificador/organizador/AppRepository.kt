package com.meuprecificador.organizador

import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.graphics.drawable.Drawable
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext

data class InstalledApp(
    val label: String,
    val packageName: String,
    val icon: Drawable,
    val category: Category,
)

class AppRepository(private val context: Context) {

    suspend fun loadInstalledApps(): List<InstalledApp> = withContext(Dispatchers.IO) {
        val pm = context.packageManager
        val mainIntent = Intent(Intent.ACTION_MAIN, null).apply {
            addCategory(Intent.CATEGORY_LAUNCHER)
        }
        val resolved = pm.queryIntentActivities(mainIntent, 0)

        val seen = HashSet<String>()
        val list = ArrayList<InstalledApp>(resolved.size)

        for (ri in resolved) {
            val pkg = ri.activityInfo.packageName ?: continue
            if (pkg == context.packageName) continue
            if (!seen.add(pkg)) continue
            val appInfo = try {
                pm.getApplicationInfo(pkg, 0)
            } catch (_: PackageManager.NameNotFoundException) {
                continue
            }
            val label = pm.getApplicationLabel(appInfo).toString()
            val icon = pm.getApplicationIcon(appInfo)
            val category = AppCategorizer.categorize(appInfo)
            list += InstalledApp(label, pkg, icon, category)
        }
        list.sortedBy { it.label.lowercase() }
    }

    fun launch(packageName: String): Boolean {
        val intent = context.packageManager.getLaunchIntentForPackage(packageName) ?: return false
        intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        return try {
            context.startActivity(intent)
            true
        } catch (_: Exception) {
            false
        }
    }

    fun openAppDetails(packageName: String) {
        val intent = Intent(android.provider.Settings.ACTION_APPLICATION_DETAILS_SETTINGS).apply {
            data = android.net.Uri.parse("package:$packageName")
            addFlags(Intent.FLAG_ACTIVITY_NEW_TASK)
        }
        context.startActivity(intent)
    }
}
