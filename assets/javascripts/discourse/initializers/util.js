
const tokenKey = "userToken"

var view;
// 是否在应用内
function isInApplication() {
    return !!navigator.userAgent.indexOf("Lazycat_Client")
}

// 是否在新窗口打开的壳
function isWebShell() {
    return !isInApplication() && navigator.userAgent.indexOf("Lazycat") != -1
}

// 是否是android webshell 环境
function isAndroid() {
    return navigator.userAgent.indexOf("Lazycat_101") != -1
}

// 是否是pc webshell 环境
function isPC() {
    return navigator.userAgent.indexOf("Lazycat_102") != -1
}

// 是否是ios webshell 环境
function isIos() {
    return navigator.userAgent.indexOf("Lazycat_103") != -1
}


// 设置指定key 对应的value
function SetValue(key, value) {
    view.SetValue(key, value);
}

// 获取指定key的value
function GetValue(key) {
    return view.GetValue(key);
}
function setTokenByKv(token) {
    let tk = {
        userToken: token,
        expireAt: token == "" ? new Date(0).toUTCString() : this.expiresFromNow(),
    }

    SetValue(tokenKey, JSON.stringify(tk))
    console.log("test value of ", tokenKey, ":", GetValue(tokenKey))
}

function getTokenByKv() {
    let tkStr = GetValue(tokenKey)
    let tk = null
    if (!!tkStr) {
        try {
            tk = JSON.parse(tkStr)
        } catch (e) {
            console.log("getTokenByKv error:", e)
        }
    }

    // token解析正常且没过期则直接返回token
    if (!!tk && new Date(tk.expireAt) > new Date()) {
        return tk.userToken
    }
    setTokenByKv("")
    return ""
}
function shouldUseKV() {
    return isAndroid();
}

function GetToken() {
    // 如果是安卓客户端（TODO：测试其他平台应用内兼容性），通过KV键值对存取token
    // 否则用cookie
    if (shouldUseKV()) {
        return getTokenByKv()
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
}

export default {
    name: "sso-utils",
    GetToken,
    GetValue,
    SetValue,
    isAndroid,
    isIos,
    isPC,
    isInApplication,
    isWebShell,
    initialize() { console.log("util initialize"); },
    initEnv() {
        if (isAndroid()) {
            // @ts-ignore
            view = android
        } else if (isPC()) {
            // @ts-ignore
            view = window.electronAPI
        } else if (isIos()) {

            // 回调方法存储器和索引ID
            var _responseCallBackFuncDict = {}
            var _responseCallBackFuncUniqueID = 1
            // JS 调用原生函数时，添加回调方法到回调方法存储器，并返回索引ID
            function _addToCallBackFuncDictWith(responseCallBackFunc) {
                if (!responseCallBackFunc) return "unValid_funcUniqueID"
                var funcUniqueID = `lzc_${_responseCallBackFuncUniqueID++}_${new Date().getTime()}`
                _responseCallBackFuncDict[funcUniqueID] = responseCallBackFunc
                return funcUniqueID
            }

            // 原生接受 JS 调用并处理相关操作后，发送回调给js, js 根据索引ID寻找回调方法来处理数据，然后移除js的回调方法
            // @ts-ignore
            if (!window.lzcAppExt_sendCallBackFunc) {
                // @ts-ignore
                window.lzcAppExt_sendCallBackFunc = function (funcUniqueID, responseData) {
                    if (!funcUniqueID) return
                    let responseCallBackFunc = _responseCallBackFuncDict[funcUniqueID]
                    if (!responseCallBackFunc) return
                    responseCallBackFunc(responseData)
                    delete _responseCallBackFuncDict[funcUniqueID]
                }
            }

            // 注册一个 JS 函数
            function _registerCallBackFunc(name) {
                if (!name) return
                return async function (...args) {
                    var returnData
                    var funcUniqueID = _addToCallBackFuncDictWith(function (data) {
                        returnData = data
                    })
                    // @ts-ignore
                    await window.webkit.messageHandlers[name].postMessage({ funcUniqueID, params: [...args] })
                    return returnData
                }
            }

            view["ScriptHandlers"] = _registerCallBackFunc("ScriptHandlers")
            let handlers = view.ScriptHandlers()
            handlers.then(function (data) {
                try {
                    data = JSON.parse(data)
                } catch (error) { }
                if (!data || data.length < 1) return
                // 注册全部可用函数
                for (const key in data) {
                    if (!data[key]) continue
                    view[data[key]] = _registerCallBackFunc(data[key])
                }
            })

        }

    }
}