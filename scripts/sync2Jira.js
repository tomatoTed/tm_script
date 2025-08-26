// ==UserScript==
// @name         Sync to Jira
// @namespace    http://tampermonkey.net/
// @version      2025-08-13.2
// @description  Sync the Jira or DevOps to Bytesforce Jira
// @author       Max
// @match        https://dev.azure.com/eminsco/**
// @require      https://cdn.bootcss.com/jquery/3.4.1/jquery.min.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bytesforce-cd.com
// @grant        GM_log
// @grant        GM_openInTab
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @grant        GM_notification
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_listValues
// @connect      jira.bytesforce-cd.com
// @run-at       context-menu
// @updateURL    https://raw.githubusercontent.com/tomatoTed/tm_script/main/scripts/sync2Jira.js

// ==/UserScript==

let scriptlog = function (log) {
    console.log("userscript: " + log)
}


function addCssForImg() {
    GM_addStyle(".bfSyncButton {color:rgba(0,120,212,1);}");
}



function getDevopsData(){
    let summary = $(`div.work-item-title-textfield`).find("input").val()
    let description = $(`div.work-item-form-control-content`).text()
    let idAndType = $(`div.work-item-form-header`).find("a.no-underline-link").text()
    let arr = idAndType.split(" ")
    let id = arr[1]
    let type = arr[0]
    let reqData = {
        "pid": "13000", // project id, 13000-EIC
        "issuetype": "10205", // 10205-UAT
        "atl_token": GM_getValue("atl_token"),
        "formToken": GM_getValue("formToken"),
        "summary": summary,
        "priority": "3", // mediumm
        "customfield_10406": id, //external ticket number
        "customfield_12000": "",
        "reporter": "max.gao",
        "assignee": "-1", // -1 is null
        "customfield_12203": "",
        "customfield_12202":"12804", //OP必填 运维支撑类型，128804-内部支撑
        "duedate": "15/Aug/25",
        "customfield_10105": "",
        "description": description,
        "dnd-dropzone": "",
        "customfield_12100": "",
        "customfield_10106": "2", // story point
        "issuelinks": "issuelinks",
        "issuelinks-linktype": "relates to",
        "customfield_11700": "",
        "customfield_11600": "",
        "customfield_11500": "",
        "customfield_11507": "",
        "customfield_11507:1": "",
        "customfield_11506": "-1",
        "customfield_11900": "",
        "timetracking_originalestimate": "",
        "timetracking_remainingestimate": "",
        "isCreateIssue": "true",
        "hasWorkStarted": "",
        "customfield_12300": "-1",
        "customfield_12301": "-1",
        "customfield_12302": "",
        "customfield_12303": "",
        "customfield_12304": "",
        "fieldsToRetain": [
            "project",
            "issuetype",
            "priority",
            "customfield_10406",
            "assignee",
            "customfield_12203",
            "customfield_12100",
            "customfield_10106",
            "duedate",
            "customfield_10105",
            "issuelinks",
            "components"
        ]
    }
    let queryString = (new URLSearchParams(reqData)).toString();
    scriptlog(queryString)
    return queryString
}


function showSyncButton() {
    $("div.project-header  div[role='menubar']").prepend(`<button type="button" id="bfSyncButton">Sync to BF</button>`)
    $("#bfSyncButton").on("click",function(){
        getFormToken()
    })

}
function getFormToken(){
    GM_xmlhttpRequest({
        url: "https://jira.bytesforce-cd.com/secure/QuickCreateIssue!default.jspa?decorator=none",
        method: "POST",
        headers: {
            "Content-type": "application/x-www-form-urlencoded"
        },
        onload: function (res) {
            if(res.status!=200){
                GM_log("login failed",res)
                GM_openInTab("https://jira.bytesforce-cd.com/login.jsp", {active: true, insert: true, setParent:true})
                return
            }
            let jsonResult = JSON.parse(res.responseText);
            GM_setValue("formToken", jsonResult.formToken);
            GM_setValue("atl_token", jsonResult.atl_token);
            scriptlog(GM_listValues())
            sync2BF()

        }
    });
}
function sync2BF() {
    let reqString = getDevopsData()
    GM_xmlhttpRequest({
        url: "https://jira.bytesforce-cd.com/secure/QuickCreateIssue.jspa?decorator=none",
        method: "POST",
        data: reqString,
        headers: {
            "Content-type": "application/x-www-form-urlencoded"
        },
        onload: function (res) {
            GM_log(res.responseText)
            GM_notification({
                title: `Sync to BF Jira Success`,
                text: "Jira ticket number",
                onclick: (event) => {
                    // The userscript is still running, so don't open example.com
                    event.preventDefault();
                }
            });
        }
    });

}

function runner() {
    setTimeout(showSyncButton,3000)
}

(function () {
    'use strict';
    // let weburl = location.href;
    // if (weburl.indexOf("jira.bytesforce-cd.com") == -1) {
    //     return
    // }

    // addCssForImg()
    // addCssForSprint()


    $(document).ready(function () {
        scriptlog('start running');
        runner()
        // timer = setInterval(runner,3000)
    });
    // Your code here...
})();
