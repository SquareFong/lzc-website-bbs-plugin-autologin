import { isAndroid, GetToken, getCSRF } from "./util";
import { getOwner } from "discourse-common/lib/get-owner";
export default {
  name: 'alert',
  initialize() {
    console.log('alert boxes are annoying!');
    if (isAndroid()) {
      console.log("在安卓里面")
      console.log(GetToken())
      let data = JSON.parse(document.getElementById("data-preloaded").dataset.preloaded)
      if (!!data && !data.currentUser) {
        if (!!GetToken()) {
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