const tokenKey = "userToken"
export default {
  name: 'lzc-website-bbs-plugin-autologin',
  lzcext: null,
  getCsrfToken() {
    let el = document.getElementsByName("csrf-token")
    if (!!el && !!el.length) {
      return el[0].content
    }
    return null
  },
  async GetToken() {
    // 如果是安卓客户端（TODO：测试其他平台应用内兼容性），通过KV键值对存取token
    // 否则用cookie
    if (this.lzcext.isInApplication()) {
      return await this.getTokenByKv()
    }

    let s = document.cookie.split(";")
    let token = ""
    s.forEach((c) => {
      let t = c.trim().split("=")
      if (t.length == 2 && t[0] == tokenKey) {
        token = t[1]
      }
    })
    return token
  },
  async getTokenByKv() {
    let tkStr = await this.lzcext.GetValue(tokenKey)
    let tk = null
    if (!!tkStr) {
      try {
        tk = JSON.parse(tkStr)
      } catch (e) {
        console.log("token str: ", tkStr);
        console.log("getTokenByKv error:", e)
      }
    }

    // token解析正常且没过期则直接返回token
    if (!!tk && new Date(tk.expireAt) > new Date()) {
      return tk.userToken
    }
    this.setTokenByKv("")
    return ""
  },
  expiresFromNow() {
    let d = new Date()
    d.setDate(d.getDate() + 7)
    return d.toUTCString()
  },
  setTokenByKv(token) {
    let tk = {
      userToken: token,
      expireAt: token == "" ? new Date(0).toUTCString() : this.expiresFromNow(),
    }

    this.lzcext.SetValue(tokenKey, JSON.stringify(tk))
    console.log("test value of ", tokenKey, ":", this.lzcext.GetValue(tokenKey))
  },
  async autoSso() {
    if (this.lzcext.isInApplication()) {
      console.log("在客户端中")

      // 强制调出底栏
      this.lzcext.SetControlViewVisibility(true)
      let userToken = await this.GetToken()
      console.log("token", userToken)
      let data = JSON.parse(document.getElementById("data-preloaded").dataset.preloaded)

      if (!!data && !data.currentUser) {
        // bbs未登录，查看是否需要登录
        if (!!userToken) {
          let url = new URL(`${window.location.origin}/session/sso`)
          url.searchParams.append("return_path", window.location.pathname)
          window.location.href = url.toString()
        }
      }

      if (!!data && !!data.currentUser) {
        // bbs已登录，查看是否需要退出登录
        let user = JSON.parse(data.currentUser)
        if (!!user && !!user.username && this.getCsrfToken() && !userToken) {
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
  async initialize() {
    this.lzcext = await import("https://cdn.jsdelivr.net/npm/@lazycatcloud/lzc-app-ext@latest/dist/index.js")
    console.log("lzcext", this.lzcext);

    console.log('initialize sso login');

    if (this.lzcext.isInApplication()) {
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