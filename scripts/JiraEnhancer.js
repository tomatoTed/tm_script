// ==UserScript==
// @name         Jira Enhancer
// @namespace    http://tampermonkey.net/
// @version      2024-09-06.1
// @description  It is provide some tools to enhance the features for Jira
// @author       Max Gao
// @match        https://jira.bytesforce-cd.com/**
// @require      https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bytesforce-cd.com
// @grant        GM_addStyle
// ==/UserScript==

let scriptlog = function(log){
    console.log("userscript: " + log)
}
let timer;
let counter = 0;

function addCssForImg(){
    GM_addStyle(".image-wrap img{width:100%;}");
    GM_addStyle("div.mce-edit-area img{width:100%;}");
}
function addCssForSprint(){
    GM_addStyle(".sprint-id{display: inline-block;border-radius: 5px;padding: 0 5px;background: #1d63db;margin-right: 10px;color: #fff;}");
}


function showSprintID(){
    $("div.ghx-sprint-group").find("div.js-sprint-container").each(function(index, element) {
        // 根据索引或元素本身执行不同的操作
        let $ele = $(element)
        let $sprintIdEle = $ele.find("div.sprint-id")
        if($sprintIdEle.length>0) {
            return
        }
        let sprintId = $ele.data("sprint-id")
        $ele.attr("title",sprintId)
        $ele.find("div.ghx-expander").after(`<div class="sprint-id">${sprintId}</div>`)
        scriptlog(`add sprint ID  ${sprintId}`)

    });
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
            $img.removeAttr("height").wrap(`<a id="${id}_thumb" href="${iSrc}" title="Jira Image Previewer" file-preview-type="image" file-preview-id="${id}" file-preview-title="add-ons" resolved=""></a>`)
        } else {
            // 有preview
            let aSrc = $a.attr("href");
            if(iSrc!=aSrc){
                $img.removeAttr("height").attr("src",aSrc);
            }
        }
    });

}

function runner(){
    showSprintID()
    showClearImg()
    scriptlog(`run time ${counter}`)
    counter++
}

(function() {
    'use strict';
    let weburl = location.href;
    if (weburl.indexOf("jira.bytesforce-cd.com") == -1) {
        return
    }

    addCssForImg()
    addCssForSprint()


    $(document).ready(function() {
        scriptlog('start running');
        runner()
        timer = setInterval(runner,3000)
    });
    // Your code here...
})();
