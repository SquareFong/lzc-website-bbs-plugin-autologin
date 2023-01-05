import util from "./util";
export default {
  name: 'lzc-website-bbs-plugin-autologin',
  getCsrfToken() {
    let el = document.getElementsByName("csrf-token")
    if (!!el && !!el.length) {
      return el[0].content
    }
    return null
  },
  autoSso() {
    if (util.isInApplication()) {
      console.log("在客户端中")

      // 强制调出底栏
      util.SetControlViewVisibility(true)

      console.log(util.GetToken())
      let data = JSON.parse(document.getElementById("data-preloaded").dataset.preloaded)

      if (!!data && !data.currentUser) {
        // bbs未登录，查看是否需要登录
        if (!!util.GetToken()) {
          let url = new URL(`${window.location.origin}/session/sso`)
          url.searchParams.append("return_path", window.location.pathname)
          window.location.href = url.toString()
        }
      }

      if (!!data && !!data.currentUser) {
        // bbs已登录，查看是否需要退出登录
        let user = JSON.parse(data.currentUser)
        if (!!user && !!user.username && this.getCsrfToken() && !util.GetToken()) {
          fetch(`/session/${user.username}`, {
            method: "DELETE", headers: {
              "X-Requested-With": "XMLHttpRequest",
              "X-CSRF-Token": this.getCsrfToken(),
            }
          }).then(() => { location.reload() })
        }
      }
    } else {
      console.log("在浏览器里")
    }
  },
  initialize() {
    console.log('initialize sso login');
    console.log(util)
    util.initEnv()

    if (util.isAndroid()) {
      let sty = document.createElement("style")
      sty.innerHTML += "li.logout{display:none;}"
      document.head.append(sty)
    }

    this.autoSso()

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