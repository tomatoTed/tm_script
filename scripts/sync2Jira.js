// ==UserScript==
// @name         Sync to Jira
// @namespace    http://tampermonkey.net/
// @version      2025-01-09.03
// @description  Sync the Jira or DevOps to Bytesforce Jira
// @author       Max
// @match        https://dev.azure.com/eminsco/**
// @require      https://code.jquery.com/jquery-3.4.1.min.js
// @require      https://cdn.jsdelivr.net/npm/moment@2.30.1/moment.min.js
// @require      https://unpkg.com/turndown/dist/turndown.js
// @icon         https://www.google.com/s2/favicons?sz=64&domain=bytesforce-cd.com
// @grant        GM_log
// @grant        GM_openInTab
// @grant        GM_xmlhttpRequest
// @grant        GM_addStyle
// @connect      jira.bytesforce-cd.com
// @updateURL    https://raw.githubusercontent.com/tomatoTed/tm_script/main/scripts/sync2Jira.js

// ==/UserScript==
//1 重复检验
//2 auto set due date - done
//3 button control
//4 description enhancement

const setting={
    formToken:"",
    atl_token:"",
    ownerId:""
}
const turndownService = new TurndownService({
  headingStyle: 'atx', // or 'setext'
  hr: '\r\n',
  bulletListMarker: '#', // or '*', '+'
  codeBlockStyle: 'fenced', // or 'indented'
  emDelimiter: '_', // or '*'
});

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
    //summary
    let summary = $(`div.work-item-title-textfield`).find("input").val()
    //id and type
    let idAndType = $(`div.work-item-form-header`).find("a.no-underline-link").text()
    let arr = idAndType.split(" ")
    if(arr.length<2){
        alert("the idAndType is incorrect "+idAndType)
        return
    }
    let externalKey = arr[1]
    let type = arr[0]

    let bfIssueType="10002"
    if ("BUG"==type){
       bfIssueType = "10205"
    }

    //description
    let description = ""
    $(`div.rooster-editor`).each(function(index, element) {
        let label  = $(element).attr("aria-label")
        if(label == "Repro Steps"||label == "System Info"||label == "Description" ||label == "Impact Analysis"){
            let content = turndownService.turndown($(element).html())
            if(content != ""){
                description = description + "h1. " + label + "\r\n" + content + "\r\n"
            }
        }
    });

    let rawData = {
        "rawType":type,
        "externalKey":externalKey,
        "description":description,
        "summary":summary,
        "bfIssueType":bfIssueType
    }
    return rawData
}

function getRawData(){
    //devops
    return getDevopsData()
}

function getImageBinary(url) {

    let byteArray
    fetch(url)
    .then(response => response.arrayBuffer())
    .then(arrayBuffer => {
        byteArray = new Uint8Array(arrayBuffer);
    })
    .catch(error => console.error('Error fetching image:', error));
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
            let respJson = JSON.parse(res.responseText);
            let ownerId="max.gao"

            let asignee = respJson.fields.find((item) => item.id =="assignee")
            let owner=asignee.editHtml.match(/(?<=reporter=)(.*?)(?=&)/g)
            if (owner!=null && owner.length>0){
                ownerId=owner[0]
            }

            setting.formToken=respJson.formToken
            setting.atl_token=respJson.atl_token
            setting.ownerId=ownerId
            GM_log("update the setting",setting)
            sync2BF()
        }
    });
}

function queryDuplicate() {
    let rawData = getRawData()

    let reqData = {
        "startIndex": "0",
        "layoutKey": "list-view",
        "jql": `project = EIC AND "External Ticket No" ~ "${rawData.externalKey}"`
    }
    let reqString = (new URLSearchParams(reqData)).toString();
    GM_log("check duplicate string",reqString)

    GM_xmlhttpRequest({
        url: "https://jira.bytesforce-cd.com/rest/issueNav/1/issueTable",
        method: "POST",
        data: reqString,
        headers: {
            "Content-type": "application/x-www-form-urlencoded",
            "x-atlassian-token":"no-check"
        },
        onload: function (res) {
            if(res.status!=200){
                GM_log("login failed",res)
                GM_openInTab("https://jira.bytesforce-cd.com/login.jsp", {active: true, insert: true, setParent:true})
                return
            }
            GM_log("response of checking duplication",res.responseText)
            var respJson = JSON.parse(res.responseText)
            if (respJson.issueTable.issueKeys!=null||respJson.issueTable.issueKeys.length>0){
                alert("the external key "+rawData.externalKey +" has already existed")
                return
            }
            getFormToken()
        }
    });

}
function sync2BF() {
    let rawData = getRawData()
    let reqData = {
        "pid": "13000", // project id, 13000-EIC
        "issuetype": rawData.bfIssueType, // 10205-UAT
        "atl_token": setting.atl_token,
        "formToken": setting.formToken,
        "summary": rawData.summary,
        "priority": "3", // mediumm
        "customfield_10406": rawData.externalKey, //external ticket number
        "customfield_12000": "",
        "reporter": setting.ownerId,
        "assignee": "-1", // -1 is null
        "customfield_12203": "",
        "customfield_12202":"12804", //OP必填 运维支撑类型，128804-内部支撑
        "duedate": moment().weekday(5).format('D/MMM/YY'),//下个周五
        "customfield_10105": "",
        "description": rawData.description,
        "dnd-dropzone": "",
        "customfield_12100": "",
        "customfield_10106": "1", // story point
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
    let reqString = (new URLSearchParams(reqData)).toString();
    GM_log("sync query string",reqString)
    GM_xmlhttpRequest({
        url: "https://jira.bytesforce-cd.com/secure/QuickCreateIssue.jspa?decorator=none",
        method: "POST",
        data: reqString,
        headers: {
            "Content-type": "application/x-www-form-urlencoded"
        },
        onload: function (res) {
            GM_log("response of creation",res.responseText)
            var respJson = JSON.parse(res.responseText)
            if (!respJson.issueKey){
                alert("sync failed")
                return
            }
            GM_log("sync to Jira success",respJson.issueKey)
            GM_log("https://jira.bytesforce-cd.com/browse/"+respJson.issueKey)
            alert("sync success "+respJson.issueKey)
        }
    });

}

function run() {
    showSyncButton()
}

(function () {
    'use strict';
    addCss()

    $(document).ready(function () {
        GM_log('start running');
        run()
        setInterval(run,1000)
    });
    // Your code here...
})();
