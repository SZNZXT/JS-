// ==UserScript==
// @name         快手自动讲解助手1.2
// @namespace    com.kwaixiaodian.zs.page.helper1111
// @version      1.2
// @description  在网页上自动发送话术，并判断是否正在讲解
// @author       图南
// @icon         https://static.neituixiaowangzi.com/company/2017/10-28/080930344531413631.png
// @match        https://zs.kwaixiaodian.com/page/helper
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

    const settingsDiv = document.createElement('div');
    settingsDiv.style.cssText = `
    position: fixed;
    bottom: 20px;
    right: 20px;
    background: white;
    border: 1px solid #ccc;
    border-radius: 5px;
    padding: 15px;
    z-index: 9999;
  `;
    settingsDiv.innerHTML = `
    <h3><strong>快手自动讲解助手</strong></h3>
    <label>话术列表（每行一个）：</label>
    <br>
    <textarea id="huashuList" rows="5" cols="50" style="resize: none;"></textarea>
    <br>
    <label>发送话术间隔（秒）：</label>
    <input type="number" id="sendInterval" min="1" value="10" />
    <br>
    <label>检测讲解间隔（秒）：</label>
    <input type="number" id="detectInterval" min="1" value="5" />
    <br>
    <label>页面刷新间隔（分钟）：</label>
    <input type="number" id="refreshInterval" min="1" value="10" />
    <br>
    <br>
    <button id="startBtn">开始运行</button>
    <button id="stopBtn">停止运行</button>
    <br>

  `;
    document.body.appendChild(settingsDiv);
    const inputStyle = document.createElement('style');
    inputStyle.textContent = `
  #huashuList, #sendInterval, #detectInterval, #refreshInterval {
    border: 1px solid #ccc !important;
  }
  #sendInterval, #detectInterval, #refreshInterval {
    width: 50px;
    margin-right: 10px;
}
`;
    document.head.appendChild(inputStyle);

    const huashuListTextarea = document.getElementById('huashuList');
    const sendIntervalInput = document.getElementById('sendInterval');
    const detectIntervalInput = document.getElementById('detectInterval');
    const refreshIntervalInput = document.getElementById('refreshInterval');
    const startBtn = document.getElementById('startBtn');
    const stopBtn = document.getElementById('stopBtn');

    // 加载保存的设置
    huashuListTextarea.value = localStorage.getItem('huashuList') || '';
    sendIntervalInput.value = localStorage.getItem('sendInterval') || '188';
    detectIntervalInput.value = localStorage.getItem('detectInterval') || '18';
    refreshIntervalInput.value = localStorage.getItem('refreshInterval') || '20';

    let sendHuashuTimeout;
    let detectAndClickTimeout;
    let refreshTimeout;

    startBtn.addEventListener('click', () => {
        let huashu = huashuListTextarea.value.split('\n').filter(line => line.trim() !== '');
        let sendInterval = parseInt(sendIntervalInput.value) * 1000;
        let detectInterval = parseInt(detectIntervalInput.value) * 1000;
        let refreshInterval = parseInt(refreshIntervalInput.value) * 60000;

        // 保存设置
        localStorage.setItem('huashuList', huashuListTextarea.value);
        localStorage.setItem('sendInterval', sendIntervalInput.value);
        localStorage.setItem('detectInterval', detectIntervalInput.value);
        localStorage.setItem('refreshInterval', refreshIntervalInput.value);

        if (event.isTrusted) localStorage.removeItem('lineIndex');
        let lineIndex = parseInt(localStorage.getItem('lineIndex')) || 0;
        async function sendHuashu() {
            try {

                const inputElement = document.querySelector('div.reply-all--i7FFC input.ant-input');

                if (inputElement && lineIndex < huashu.length) {
                    // 清空输入框
                    inputElement.value = '';
                    inputElement.dispatchEvent(new Event('input', { bubbles: true }));

                    // 使用下面这行代码替换原本设置 inputElement.value 的代码
                    Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, "value").set.call(inputElement, huashu[lineIndex]);
                    inputElement.dispatchEvent(new Event('input', { bubbles: true }));

                    // 等待一秒后再点击发送按钮
                    setTimeout(() => {
                        const sendButton = document.querySelector('div.footer--n7CIq button');
                        if (sendButton) {
                            sendButton.click();
                        }
                    }, 1000);

                    lineIndex = (lineIndex + 1) % huashu.length;
                    localStorage.setItem('lineIndex', lineIndex);
                }

                sendHuashuTimeout = setTimeout(sendHuashu, sendInterval);

            } catch (error) {
                console.error('sendHuashu error:', error);
                updateStatus('遇到故障', error.message);
            }
        }

        async function detectAndClick() {
            try {


                const startBtn = document.evaluate("//button[@class='ant-btn btn--JXmnr']//span[text()='开始讲解']", document, null, XPathResult.FIRST_ORDERED_NODE_TYPE, null).singleNodeValue;

                if (startBtn) {
                    startBtn.click();
                }
                detectAndClickTimeout = setTimeout(detectAndClick, detectInterval);

            } catch (error) {
                console.error('detectAndClick error:', error);
                updateStatus('遇到故障', error.message);
            }
        }

        function refreshPage() {
            location.reload();
        }

        clearTimeout(sendHuashuTimeout);
        clearTimeout(detectAndClickTimeout);
        clearTimeout(refreshTimeout);

        sendHuashu();
        detectAndClick();
        refreshTimeout = setTimeout(refreshPage, refreshInterval);
    });


    stopBtn.addEventListener('click', () => {
        clearTimeout(sendHuashuTimeout);
        clearTimeout(detectAndClickTimeout);
        clearTimeout(refreshTimeout);
        localStorage.removeItem('lineIndex'); // 添加这行代码以删除保存的 lineIndex
    });

    // 如果之前保存的lineIndex不为null，说明脚本之前在运行
    if (localStorage.getItem('lineIndex') !== null) {
        startBtn.click();
    }
    const statusDiv = document.createElement('div');
    statusDiv.style.cssText = `
  position: fixed;
  bottom: 20px;
  right: 20px;
  background: white;
  border: 1px solid #ccc;
  border-radius: 5px;
  padding: 10px;
  z-index: 9999;
  color: black; /* 初始颜色 */
`;
    statusDiv.innerHTML = `
  <h3>脚本状态</h3>
  <div id="scriptStatus"><strong>未运行</strong></div>
`;
    document.body.appendChild(statusDiv);

    const scriptStatusDiv = document.getElementById('scriptStatus');


    function updateStatus(status, error) {
        scriptStatusDiv.innerText = status;
        if (error) {
            scriptStatusDiv.innerText += `: ${error}`;
        }
        if (status === '运行中') {
            scriptStatusDiv.style.color = 'green';
        } else if (status === '已停止') {
            scriptStatusDiv.style.color = 'red';
        } else if (status === '遇到故障') {
            scriptStatusDiv.style.color = 'orange';
        } else {
            scriptStatusDiv.style.color = 'blue';
        }
    }
    startBtn.addEventListener('click', () => {
        updateStatus('运行中');
    });

    stopBtn.addEventListener('click', () => {
        updateStatus('已停止');
    });

    if (localStorage.getItem('lineIndex') !== null) {
        startBtn.click();
        updateStatus('运行中');
    }
})();