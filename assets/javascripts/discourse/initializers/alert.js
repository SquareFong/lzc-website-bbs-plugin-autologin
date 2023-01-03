import util from "./util";
export default {
  name: 'alert',
  initialize() {
    console.log(util)
    console.log('alert boxes are annoying!');
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
  }
};