// ==UserScript==
// @name         Show You Want
// @namespace    http://tampermonkey.net/
// @version      2025-05-15.1
// @description  Customize the shown content.
// @author       Max
// @match        https://d2c.hotfix.bix.bytesforce.com/**
// @grant        GM_addStyle
// ==/UserScript==

let scriptlog = function(log){
    console.log("userscript: " + log)
}
let timer;
let counter = 0;


function replaceKeyword(keywords, replacements){

    if (keywords.length!=replacements.length){
        return
    }


    // 获取页面中的所有文本节点
    const walker = document.createTreeWalker(
      document.body,
      NodeFilter.SHOW_TEXT,
      null,
      false
    );

    let node;
    while (node = walker.nextNode()) {
        let value=node.nodeValue
        for(var i = 0; i < keywords.length; i++){
            value=value.replace(new RegExp(keywords[i], 'ig'), replacements[i]);
            //scriptlog(`replace ${keywords[i]}->${replacements[i]}`)
        }
        // 替换文本内容中的关键词
        node.nodeValue = value
    }
}


function runner(){
    let keywords=["income","BIX"]
    let replacements=["Bytesforce","InsureMate"]
    replaceKeyword(keywords,replacements)
    scriptlog(`run time ${counter}`)
    counter++

}

(function() {
    'use strict';
    let weburl = location.href;
    if (weburl.indexOf("d2c.hotfix.bix.bytesforce.com") == -1) {
        return
    }

    scriptlog('start running');
    runner()
    timer = setInterval(runner,300)
})();
