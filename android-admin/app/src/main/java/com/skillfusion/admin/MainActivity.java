package com.skillfusion.admin;

import android.annotation.SuppressLint;
import android.app.Activity;
import android.content.ClipData;
import android.content.ClipboardManager;
import android.content.Context;
import android.content.Intent;
import android.graphics.Color;
import android.graphics.Typeface;
import android.graphics.drawable.GradientDrawable;
import android.net.Uri;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.webkit.CookieManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebChromeClient;
import android.webkit.WebResourceError;
import android.webkit.WebResourceRequest;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;
import android.widget.Toast;

public class MainActivity extends Activity {
    private static final String ADMIN_URL = "https://wiliejonathan.github.io/skill-fusion-affiliate/admin/";
    private WebView webView;
    private TextView statusView;
    private ProgressBar progressBar;

    private static final String MECHANICAL_JS =
        "(function(){" +
        "try{" +
        "document.documentElement.classList.add('sf-apk-mechanical');" +
        "if(!document.getElementById('sf-apk-mechanical-style')){" +
        "var s=document.createElement('style');s.id='sf-apk-mechanical-style';" +
        "s.textContent=" +
        "'html,body{background:#080d13!important;color:#eaf1f7!important}'+" +
        "'body{background-image:linear-gradient(rgba(58,213,255,.025) 1px,transparent 1px),linear-gradient(90deg,rgba(58,213,255,.025) 1px,transparent 1px)!important;background-size:22px 22px!important}'+" +
        "'.shell{background:transparent!important}'+" +
        "'aside{background:linear-gradient(180deg,#0b1118,#0a0f15)!important;border-color:#2a3847!important}'+" +
        "'.panel,.stats article,.admin-product,.admin-login-card,.table,.logic{background:linear-gradient(145deg,#141d27,#0d141c)!important;border-color:#2f3d4c!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.035),0 8px 24px rgba(0,0,0,.24)!important}'+" +
        "'.eyebrow{color:#39d5ff!important;letter-spacing:.16em!important}'+" +
        "'h1,h2,h3,strong{color:#eef4fb!important}'+" +
        "'p,small,.admin-product-body small{color:#8d9caf!important}'+" +
        "'.dashboard-action,.admin-logout,.actions button,.admin-login-button,.import-mode,.paste-icon-btn,.clear-links-btn{border-radius:6px!important;text-transform:uppercase!important;letter-spacing:.04em!important;box-shadow:inset 0 1px 0 rgba(255,255,255,.06),0 2px 0 #05080c!important}'+" +
        "'.dashboard-action{background:linear-gradient(#17222c,#111820)!important;border-color:#344657!important;color:#9fc7de!important}'+" +
        "'.dashboard-action.refresh-all,.dashboard-action.reload-all,.dashboard-action.repair-images{color:#39d5ff!important;border-color:#31566e!important}'+" +
        "'.import-mode-bar{background:#0b1118!important;border-color:#2e3c4b!important;border-radius:7px!important}'+" +
        "'.import-mode.active{background:linear-gradient(#202b36,#141c25)!important;color:#f5b841!important;box-shadow:inset 0 -2px 0 #f5b841!important}'+" +
        "'textarea,.admin-login-card input{background:#080d13!important;color:#edf3f8!important;border-color:#354555!important;border-radius:6px!important;caret-color:#f5b841!important}'+" +
        "'textarea:focus,.admin-login-card input:focus{border-color:#f5b841!important;box-shadow:0 0 0 2px rgba(245,184,65,.12)!important}'+" +
        "'.paste-icon-btn{background:#111c26!important;color:#39d5ff!important;border-color:#31566e!important}'+" +
        "'.detected-link-counter{background:#111820!important;color:#f5b841!important;border-color:#5b4727!important;border-radius:5px!important}'+" +
        "'.clear-links-btn{background:#1c1214!important;color:#ff7474!important;border-color:#633b40!important}'+" +
        "'.notice{background:#0c1d18!important;border-color:#245845!important;color:#71e7b5!important}'+" +
        "'.import-job-progress{background:#0d151d!important;border-color:#334454!important}'+" +
        "'.import-job-progress-head{color:#f5b841!important}'+" +
        "'.import-job-track{background:#19232d!important}'+" +
        "'.import-job-track i{background:repeating-linear-gradient(90deg,#f5b841 0 10px,#39d5ff 10px 14px)!important}'+" +
        "'.status.ready,.status.unique{background:#0d2b21!important;color:#72eab7!important}'+" +
        "'.status.duplicate{background:#32191e!important;color:#ff8b8b!important}'+" +
        "'.row.head{background:#0b1219!important}'+" +
        "'.row{border-color:#293744!important}'+" +
        "'.admin-login-page{background:radial-gradient(circle at 15% 10%,rgba(57,213,255,.08),transparent 28%),radial-gradient(circle at 85% 90%,rgba(245,184,65,.08),transparent 30%),#080d13!important}'+" +
        "'.admin-password-toggle{color:#f5b841!important}'+" +
        "'::-webkit-scrollbar{width:7px}::-webkit-scrollbar-track{background:#080d13}::-webkit-scrollbar-thumb{background:#344454;border-radius:4px}'+" +
        "'@media(max-width:900px){aside{border-bottom:1px solid #2a3847!important}}';" +
        "document.head.appendChild(s);" +
        "}" +
        "try{if(window.AndroidClipboard){" +
        "var cb={readText:function(){return Promise.resolve(window.AndroidClipboard.readText());},writeText:function(v){window.AndroidClipboard.writeText(String(v||''));return Promise.resolve();}};" +
        "try{Object.defineProperty(navigator,'clipboard',{configurable:true,value:cb});}catch(e){navigator.clipboard=cb;}" +
        "}}catch(e){}" +
        "}catch(e){}" +
        "})();";

    @Override
    @SuppressLint({"SetJavaScriptEnabled", "JavascriptInterface"})
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        getWindow().setStatusBarColor(Color.rgb(7, 10, 14));
        getWindow().setNavigationBarColor(Color.rgb(7, 10, 14));

        LinearLayout root = new LinearLayout(this);
        root.setOrientation(LinearLayout.VERTICAL);
        root.setBackgroundColor(Color.rgb(8, 13, 19));

        LinearLayout top = new LinearLayout(this);
        top.setOrientation(LinearLayout.HORIZONTAL);
        top.setGravity(Gravity.CENTER_VERTICAL);
        top.setPadding(dp(14), dp(8), dp(10), dp(8));
        GradientDrawable topBg = new GradientDrawable(
            GradientDrawable.Orientation.LEFT_RIGHT,
            new int[]{Color.rgb(10, 15, 21), Color.rgb(15, 23, 31)}
        );
        topBg.setStroke(dp(1), Color.rgb(39, 53, 67));
        top.setBackground(topBg);

        TextView mark = new TextView(this);
        mark.setText("SF");
        mark.setGravity(Gravity.CENTER);
        mark.setTextColor(Color.rgb(245, 184, 65));
        mark.setTextSize(14);
        mark.setTypeface(Typeface.DEFAULT_BOLD);
        GradientDrawable markBg = new GradientDrawable();
        markBg.setColor(Color.rgb(9, 14, 20));
        markBg.setStroke(dp(1), Color.rgb(245, 184, 65));
        markBg.setCornerRadius(dp(7));
        mark.setBackground(markBg);
        top.addView(mark, new LinearLayout.LayoutParams(dp(40), dp(40)));

        LinearLayout titleBox = new LinearLayout(this);
        titleBox.setOrientation(LinearLayout.VERTICAL);
        titleBox.setPadding(dp(11), 0, 0, 0);

        TextView title = new TextView(this);
        title.setText("SKILL FUSION // ADMIN");
        title.setTextColor(Color.rgb(236, 243, 249));
        title.setTextSize(13);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        title.setLetterSpacing(.055f);

        TextView subtitle = new TextView(this);
        subtitle.setText("MECHANICAL CONTROL CONSOLE");
        subtitle.setTextColor(Color.rgb(57, 213, 255));
        subtitle.setTextSize(8);
        subtitle.setLetterSpacing(.10f);

        titleBox.addView(title);
        titleBox.addView(subtitle);
        top.addView(titleBox, new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        statusView = new TextView(this);
        statusView.setText("BOOT");
        statusView.setGravity(Gravity.CENTER);
        statusView.setTextColor(Color.rgb(245, 184, 65));
        statusView.setTextSize(8);
        statusView.setTypeface(Typeface.MONOSPACE, Typeface.BOLD);
        statusView.setLetterSpacing(.08f);
        statusView.setPadding(dp(8), dp(6), dp(8), dp(6));
        GradientDrawable statusBg = new GradientDrawable();
        statusBg.setColor(Color.rgb(11, 17, 24));
        statusBg.setStroke(dp(1), Color.rgb(52, 68, 84));
        statusBg.setCornerRadius(dp(5));
        statusView.setBackground(statusBg);
        top.addView(statusView);

        TextView refresh = new TextView(this);
        refresh.setText("↻");
        refresh.setTextColor(Color.rgb(57, 213, 255));
        refresh.setTextSize(24);
        refresh.setGravity(Gravity.CENTER);
        refresh.setOnClickListener(v -> {
            statusView.setText("SYNC");
            if (webView != null) webView.reload();
        });
        top.addView(refresh, new LinearLayout.LayoutParams(dp(44), dp(44)));

        root.addView(top, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(58)));

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(100);
        progressBar.setProgressTintList(android.content.res.ColorStateList.valueOf(Color.rgb(245, 184, 65)));
        progressBar.setProgressBackgroundTintList(android.content.res.ColorStateList.valueOf(Color.rgb(27, 38, 49)));
        root.addView(progressBar, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(3)));

        webView = new WebView(this);
        webView.setBackgroundColor(Color.rgb(8, 13, 19));
        webView.addJavascriptInterface(new ClipboardBridge(this), "AndroidClipboard");

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadsImagesAutomatically(true);
        settings.setUseWideViewPort(true);
        settings.setLoadWithOverviewMode(false);
        settings.setBuiltInZoomControls(false);
        settings.setDisplayZoomControls(false);
        settings.setAllowFileAccess(false);
        settings.setAllowContentAccess(false);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        settings.setSafeBrowsingEnabled(true);
        settings.setUserAgentString(settings.getUserAgentString() + " SkillFusionAdmin/1.0");

        CookieManager cookies = CookieManager.getInstance();
        cookies.setAcceptCookie(true);
        cookies.setAcceptThirdPartyCookies(webView, true);

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onProgressChanged(WebView view, int progress) {
                progressBar.setProgress(progress);
                progressBar.setVisibility(progress >= 100 ? View.GONE : View.VISIBLE);
            }
        });

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public void onPageStarted(WebView view, String url, android.graphics.Bitmap favicon) {
                statusView.setText("SYNCING");
                statusView.setTextColor(Color.rgb(245, 184, 65));
                progressBar.setVisibility(View.VISIBLE);
            }

            @Override
            public void onPageFinished(WebView view, String url) {
                statusView.setText("ONLINE");
                statusView.setTextColor(Color.rgb(113, 231, 181));
                injectMechanicalTheme();
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                return routeUri(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                return routeUri(Uri.parse(url));
            }

            @Override
            public void onReceivedError(WebView view, WebResourceRequest request, WebResourceError error) {
                if (request.isForMainFrame()) {
                    statusView.setText("OFFLINE");
                    statusView.setTextColor(Color.rgb(255, 105, 105));
                }
            }
        });

        root.addView(webView, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        TextView footer = new TextView(this);
        footer.setText("● SECURE LINK   //   CHECKPOINT QUEUE   //   CLIENT SYNC");
        footer.setGravity(Gravity.CENTER);
        footer.setTextColor(Color.rgb(89, 106, 124));
        footer.setTextSize(7.5f);
        footer.setTypeface(Typeface.MONOSPACE);
        footer.setLetterSpacing(.04f);
        footer.setBackgroundColor(Color.rgb(7, 10, 14));
        root.addView(footer, new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, dp(24)));

        setContentView(root);
        webView.loadUrl(ADMIN_URL);
    }

    private void injectMechanicalTheme() {
        if (webView != null) webView.evaluateJavascript(MECHANICAL_JS, null);
    }

    private boolean routeUri(Uri uri) {
        if (uri == null) return false;
        String scheme = uri.getScheme();
        String host = uri.getHost();

        if ("https".equalsIgnoreCase(scheme) && host != null && host.endsWith("github.io")) {
            return false;
        }

        if ("https".equalsIgnoreCase(scheme) || "http".equalsIgnoreCase(scheme)) {
            try {
                startActivity(new Intent(Intent.ACTION_VIEW, uri));
            } catch (Exception e) {
                Toast.makeText(this, "Tidak ada aplikasi untuk membuka link.", Toast.LENGTH_SHORT).show();
            }
            return true;
        }
        return false;
    }

    private int dp(int value) {
        return Math.round(value * getResources().getDisplayMetrics().density);
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (webView != null) {
            webView.onResume();
            webView.evaluateJavascript("try{document.dispatchEvent(new Event('visibilitychange'));}catch(e){}", null);
            injectMechanicalTheme();
        }
    }

    @Override
    protected void onPause() {
        if (webView != null) webView.onPause();
        super.onPause();
    }

    @Override
    @SuppressWarnings("deprecation")
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) webView.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (webView != null) {
            webView.removeJavascriptInterface("AndroidClipboard");
            webView.stopLoading();
            webView.destroy();
        }
        super.onDestroy();
    }

    private static class ClipboardBridge {
        private final Context context;

        ClipboardBridge(Context context) {
            this.context = context.getApplicationContext();
        }

        @JavascriptInterface
        public String readText() {
            ClipboardManager manager = (ClipboardManager) context.getSystemService(Context.CLIPBOARD_SERVICE);
            if (manager == null || !manager.hasPrimaryClip()) return "";
            ClipData data = manager.getPrimaryClip();
            if (data == null || data.getItemCount() == 0) return "";
            CharSequence text = data.getItemAt(0).coerceToText(context);
            return text == null ? "" : text.toString();
        }

        @JavascriptInterface
        public void writeText(String value) {
            ClipboardManager manager = (ClipboardManager) context.getSystemService(Context.CLIPBOARD_SERVICE);
            if (manager != null) {
                manager.setPrimaryClip(ClipData.newPlainText("Skill Fusion", value == null ? "" : value));
            }
        }
    }
}
