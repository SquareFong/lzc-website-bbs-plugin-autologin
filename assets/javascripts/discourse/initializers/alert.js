import util from "./util";
export default {
  name: 'lzc-website-bbs-plugin-autologin',
  autoSso() {
    if (util.isAndroid()) {
      console.log("在安卓里面")
      console.log(util.GetToken())
      let data = JSON.parse(document.getElementById("data-preloaded").dataset.preloaded)
      if (!!data && !data.currentUser) {
        if (!!util.GetToken()) {
          let url = new URL(`${window.location.origin}/session/sso`)
          url.searchParams.append("return_path", window.location.pathname)
          window.location.href = url.toString()
        }
      }
    } else {
      console.log("在浏览器里")
    }
  },
  initialize() {
    console.log(util)
    util.initEnv()
    console.log('initialize sso login');
    // 感知切webview
    addEventListener('main_app_api', (event) => {
      console.log("main_app_api", event)
      this.autoSso()
    });

    // 感知app唤醒
    addEventListener('visibilitychange', (event) => {
      if (document.visibilityState === 'visible') {
        this.autoSso()
      }
    })
  }
};
