package com.meuprecificador.organizador

import android.content.pm.ApplicationInfo

enum class Category(val titleResName: String) {
    GAMES("cat_games"),
    SOCIAL("cat_social"),
    COMMUNICATION("cat_communication"),
    PRODUCTIVITY("cat_productivity"),
    FINANCE("cat_finance"),
    SHOPPING("cat_shopping"),
    MEDIA("cat_media"),
    PHOTO("cat_photo"),
    NEWS("cat_news"),
    MAPS("cat_maps"),
    HEALTH("cat_health"),
    FOOD("cat_food"),
    TRANSPORT("cat_transport"),
    EDUCATION("cat_education"),
    TOOLS("cat_tools"),
    OTHER("cat_other"),
}

object AppCategorizer {

    /**
     * Decide a categoria de um app combinando:
     * 1) [ApplicationInfo.category] (declarada pelo desenvolvedor no manifesto, API 26+)
     * 2) Heurística por nome de pacote (cobre os apps populares no Brasil que não declaram categoria).
     */
    fun categorize(info: ApplicationInfo): Category {
        when (info.category) {
            ApplicationInfo.CATEGORY_GAME -> return Category.GAMES
            ApplicationInfo.CATEGORY_SOCIAL -> return Category.SOCIAL
            ApplicationInfo.CATEGORY_AUDIO,
            ApplicationInfo.CATEGORY_VIDEO -> return Category.MEDIA
            ApplicationInfo.CATEGORY_IMAGE -> return Category.PHOTO
            ApplicationInfo.CATEGORY_NEWS -> return Category.NEWS
            ApplicationInfo.CATEGORY_MAPS -> return Category.MAPS
            ApplicationInfo.CATEGORY_PRODUCTIVITY -> return Category.PRODUCTIVITY
        }
        return categorizeByPackage(info.packageName)
    }

    private fun categorizeByPackage(pkg: String): Category {
        val p = pkg.lowercase()
        return PACKAGE_RULES.firstOrNull { rule -> rule.matches.any { p.contains(it) } }?.category
            ?: Category.OTHER
    }

    private data class Rule(val category: Category, val matches: List<String>)

    private val PACKAGE_RULES: List<Rule> = listOf(
        Rule(Category.SOCIAL, listOf(
            "facebook", "instagram", "twitter", ".x.android", "tiktok", "snapchat",
            "pinterest", "linkedin", "reddit", "tumblr", "threads", "bluesky", "mastodon",
        )),
        Rule(Category.COMMUNICATION, listOf(
            "whatsapp", "telegram", "messenger", "signal", "discord", "skype",
            "google.android.apps.messaging", "android.email", "gm", "outlook",
            "android.dialer", "contacts", "viber", "zoom", "teams", "meet",
        )),
        Rule(Category.FINANCE, listOf(
            "nubank", "itau", "bradesco", "santander", "bb.android", "caixa",
            "inter", "c6bank", "picpay", "mercadopago", "paypal", "binance",
            "wallet", "bank", "banco", "fintech", "next", "neon", "willbank",
            "xpi", "rico", "btg", "modalmais", "easynvest", "warren", "investimento",
        )),
        Rule(Category.SHOPPING, listOf(
            "mercadolivre", "amazon.mShop", "shopee", "aliexpress", "magazineluiza",
            "americanas", "casasbahia", "submarino", "shein", "ebay", "wish",
            "shop", "store",
        )),
        Rule(Category.FOOD, listOf(
            "ifood", "ubereats", "rappi", "jamesdelivery", "zedelivery",
            "starbucks", "mcdonalds", "burgerking", "habibs", "subway",
            "delivery", "restaurant",
        )),
        Rule(Category.TRANSPORT, listOf(
            "uber", "ubercab", "99", "cabify", "blablacar", "lyft", "moovit",
            "easytaxi", "taxi", "transit",
        )),
        Rule(Category.MAPS, listOf(
            "maps", "waze", "navigation", "earth", "googleearth",
            "booking", "airbnb", "decolar", "trivago", "expedia", "kayak",
            "latam", "gol", "azul",
        )),
        Rule(Category.MEDIA, listOf(
            "spotify", "deezer", "youtube", "youtubemusic", "googlemusic",
            "netflix", "primevideo", "disney", "globoplay", "hbo", "max", "paramount",
            "vlc", "mxtech", "music", "audio", "video", "podcast", "soundcloud",
            "tidal", "amazonmusic",
        )),
        Rule(Category.PHOTO, listOf(
            "camera", "gallery", "photos", "lightroom", "snapseed", "vsco",
            "picsart", "facetune", "photoeditor", "googlecam",
        )),
        Rule(Category.NEWS, listOf(
            "news", "noticia", "globo.android", "uol", "estadao", "folha",
            "g1", "metro", "elpais", "nytimes", "kindle", "googlebooks",
            "skoob", "wattpad", "medium", "feedly",
        )),
        Rule(Category.HEALTH, listOf(
            "fitbit", "strava", "nike", "runkeeper", "samsunghealth", "health",
            "saude", "calm", "headspace", "myfitnesspal", "fitness", "yoga",
            "garmin", "polarflow", "trainingclub",
        )),
        Rule(Category.EDUCATION, listOf(
            "duolingo", "memrise", "babbel", "khan", "coursera", "udemy",
            "edmodo", "googleclassroom", "canvas", "school", "ensino",
            "educa", "wikipedia", "dict", "translate",
        )),
        Rule(Category.PRODUCTIVITY, listOf(
            "docs", "sheets", "slides", "drive", "keep", "calendar",
            "office", "word", "excel", "powerpoint", "onedrive",
            "notion", "evernote", "todoist", "anydo", "trello", "asana",
            "slack", "dropbox", "googletasks", "calculator", "calc",
            "files", "documents",
        )),
        Rule(Category.TOOLS, listOf(
            "settings", "android.settings", "systemui", "providers",
            "permissioncontroller", "packageinstaller", "wifi", "bluetooth",
            "filemanager", "filemanagerapp", "filesgo", "cleaner",
            "antivirus", "vpn", "browser", "chrome", "firefox", "opera",
            "samsung.app", "miui", "huawei", "oppo", "vivo", "android.tools",
            "launcher", "wallpaper", "keyboard", "gboard",
        )),
    )
}
