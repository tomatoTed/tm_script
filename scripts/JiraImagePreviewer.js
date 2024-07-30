// ==UserScript==
// @name         Jira Image Previewer
// @namespace    http://tampermonkey.net/
// @version      2024-07-04
// @description  It is better to preview the image in Jira
// @author       Max Gao
// @match        https://jira.bytesforce-cd.com/**
// @require      https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bytesforce-cd.com
// @grant        GM_addStyle
// ==/UserScript==

scriptlog=function(log){
    console.log("userscript: " + log)
}
let timer;
let counter = 0;

function showFullImg(){
    GM_addStyle(".image-wrap img{width:100%;}");
    GM_addStyle("div.mce-edit-area img{width:100%;}");
}
function showClearImg(){
    $("div#descriptionmodule, div#activitymodule").find("span.image-wrap").each(function(index, element) {
        // 根据索引或元素本身执行不同的操作
        let $ele = $(element)
        let $img = $ele.find("img")
        let $a = $ele.find("a")
        if ($img == null){
            return
        }
        let iSrc = $img.attr("src")
        if($a.length==0) {
            // 没有preview
            let id = iSrc.match(/\d+/)
            $img.wrap(`<a id="${id}_thumb" href="${iSrc}" title="add-ons" file-preview-type="image" file-preview-id="${id}" file-preview-title="add-ons" resolved=""></a>`)
        } else {
            // 有preview
            let aSrc = $a.attr("href");
            if(iSrc!=aSrc){
                $img.attr("src",aSrc);
            }
        }
    });
//    if (counter!=null && counter>3000){
 //       clearInterval(timer)
   // }
    scriptlog(`run time ${counter}`)
    counter++
}

(function() {
    'use strict';
    let weburl = location.href;
    if (weburl.indexOf("jira.bytesforce-cd.com") == -1) {
        return
    }

    showFullImg()

    $(document).ready(function() {
        scriptlog('start running');
        showClearImg()
        timer = setInterval(showClearImg,3000)
    });
    // Your code here...
})();
