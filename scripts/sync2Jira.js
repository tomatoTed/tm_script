// ==UserScript==
// @name         Sync to Jira
// @namespace    http://tampermonkey.net/
// @version      2025-08-27.5
// @description  Sync the Jira or DevOps to Bytesforce Jira
// @author       Max
// @match        https://dev.azure.com/eminsco/**
// @require      https://code.jquery.com/jquery-3.4.1.min.js
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
// @updateURL    https://raw.githubusercontent.com/tomatoTed/tm_script/main/scripts/sync2Jira.js

// ==/UserScript==


const setting={
    formToken:"",
    atl_token:"",
    ownerId:""
}

function addCss() {
    GM_addStyle("#bfSyncButton{background-color:rgba(0,120,212,1); color:#fff;}");
}

/**
 * issuetype:
 * 10002-Change Request
 * 10400-Production Issue
 * 10205-UAT
 * 10100-Bug
 * 10009-Epic
 * 10300-Adhoc Request
 * 
 * customfield_11800(Initiated By)
 * 12300-Internal
 * 12301-External
 */
function getDevopsData(){
    let summary = $(`div.work-item-title-textfield`).find("input").val()
    let description = $(`div.work-item-form-control-content`).text()
    let idAndType = $(`div.work-item-form-header`).find("a.no-underline-link").text()
    let arr = idAndType.split(" ")
    let id = arr[1]
    let type = arr[0]

    let issueType="10002"
    if ("BUG"==type){
       issueType = "10205"
    }
    let reqData = {
        "pid": "13000", // project id, 13000-EIC
        "issuetype": issueType, // 10205-UAT
        "atl_token": setting.atl_token,
        "formToken": setting.formToken,
        "summary": summary,
        "priority": "3", // mediumm
        "customfield_10406": id, //external ticket number
        "customfield_12000": "",
        "reporter": setting.ownerId,
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
        "customfield_11800": "12301",
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
    GM_log("sync query string",queryString)
    return queryString
}


function showSyncButton() {
    if($("#bfSyncButton").attr("type")=="button"){
        return
    }
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
            let resp = JSON.parse(res.responseText);
            const asignee = resp.fields.find((item) => item.id =="assignee")
            let ownerId=asignee.editHtml.match(/(?<=ownerId=)(.*?)(?=&)/g)[0]
            setting.formToken=resp.formToken
            setting.atl_token=resp.atl_token
            setting.ownerId=ownerId
            GM_log("update the setting",setting)

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
            GM_log("response of creation",res.responseText)
            var resp = JSON.parse(res.responseText)
            if (!resp.issueKey){
                alert("sync failed")
                return
            }
            GM_log("sync to Jira success",res.issueKey)
            GM_log("https://jira.bytesforce-cd.com/browse/"+res.issueKey)
            alert("sync success "+res.issueKey)
        }
    });

}

function run() {
    showSyncButton()
}

(function () {
    'use strict';
    // let weburl = location.href;
    // if (weburl.indexOf("jira.bytesforce-cd.com") == -1) {
    //     return
    // }

    addCss()
    // addCssForSprint()


    $(document).ready(function () {
        GM_log('start running');
        run()
        setInterval(run,1000)
    });
    // Your code here...
})();
