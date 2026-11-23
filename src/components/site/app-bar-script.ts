/**
 * Runs before the page paints (same place as the theme script): on an Android
 * browser that has not closed the bar, and is not the installed web app, it
 * marks <html data-app-bar="android">. site.css shows the bar only then, so
 * the bar is part of the first layout on Android and absent everywhere else:
 * nothing shifts in either case.
 */
export const APP_BAR_SCRIPT = `try{if(/Android/i.test(navigator.userAgent)&&!localStorage.getItem("bishare-app-bar")&&!matchMedia("(display-mode: standalone)").matches)document.documentElement.setAttribute("data-app-bar","android")}catch(e){}`;
