const apiUrl = "http://localhost:8080/notes";
let editingId = null;

async function loadNotes() {
    const search = document.getElementById("search").value;
    const tag = document.getElementById("tag-filter").value;

    let url = apiUrl;
    if (search || tag) {
        url += `?search=${encodeURIComponent(search)}&tag=${encodeURIComponent(tag)}`;
    }

    const res = await fetch(url); // ✅ 修复这里
    const notes = await res.json();

    const container = document.getElementById("notes");
    container.innerHTML = "";//先把旧的删掉再加新的

    notes.forEach(n => {//遍历每一条备忘录
        const div = document.createElement("div");//DOM创建元素
        div.className = "note";

        div.innerHTML = `
            <b>${n.title}</b>//加粗
            <p>${n.content}</p>
            <small>${n.tags || ''}</small><br>
            <small>${n.remindTime ? n.remindTime.replace("T", " ") : ""}</small><br>
        `;

        // ✅ 安全按钮（避免字符串崩溃）
        const editBtn = document.createElement("button");
        editBtn.innerText = "编辑";
        editBtn.onclick = () =>
            editNote(n.id, n.title, n.content, n.tags || '', n.remindTime || '');

        const delBtn = document.createElement("button");
        delBtn.innerText = "删除";
        delBtn.onclick = () => deleteNote(n.id);

        div.appendChild(editBtn);//把编辑按钮添加到div里
        div.appendChild(delBtn);

        container.appendChild(div);//把div添加到页面上
    });
}


//填好输入框，点添加按钮，把新备忘发给后端存起来，然后刷新页面
async function addNote() {
    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const tags = document.getElementById("tags").value;
    const remindTime = document.getElementById("remindTime").value;

    if (!title) return alert("请输入标题");

//POST请求，把新备忘录数据发给后端
    await fetch(apiUrl, {
        method: "POST",//告诉后端这是一个添加数据的请求
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, tags, remindTime })//把JS对象或者数组转换成JSON字符串
    });

    resetForm();//把输入框清空
    loadNotes();
}


//点击编辑按钮，把这条备忘的内容填回输入框，给我修改
function editNote(id, title, content, tags, remindTime) {
    editingId = id;
    document.getElementById("title").value = title;//把这条备忘的标题填回标题输入框
    document.getElementById("content").value = content;
    document.getElementById("tags").value = tags;
    document.getElementById("remindTime").value = remindTime;
    document.getElementById("update-btn").style.display = "inline";//本来是隐藏的，现在显示出来
}


//提交修改，更新备忘
async function updateNote() {
    if (!editingId) return;

    const title = document.getElementById("title").value;
    const content = document.getElementById("content").value;
    const tags = document.getElementById("tags").value;
    const remindTime = document.getElementById("remindTime").value;

    await fetch(`${apiUrl}/${editingId}`, {
        method: "PUT",//这是一个更新数据的请求
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, content, tags, remindTime })
    });

    resetForm();//结束编辑，清空输入框，恢复初始状态
    loadNotes();
}


//重置表单，清空输入框
function resetForm() {
    editingId = null;
    document.getElementById("title").value = "";
    document.getElementById("content").value = "";
    document.getElementById("tags").value = "";
    document.getElementById("remindTime").value = "";
    document.getElementById("update-btn").style.display = "none";
}


//删除备忘
async function deleteNote(id) {
    await fetch(`${apiUrl}/${id}`, { method: "DELETE" });
    loadNotes();
}

// 定时检查提醒
async function checkReminders() {
    const res = await fetch(apiUrl);//从后端把所有备忘拿过来
    const notes = await res.json();//把后端返回的JSON字符串转换成JS对象或者数组

    const now = new Date();//默认当前时间

    notes.forEach(note => {
        if (note.remindTime && !note.notified) {
            const remindDate = new Date(note.remindTime);

            if (remindDate <= now) {
                alert(`提醒: ${note.title}`);
                fetch(`${apiUrl}/${note.id}/notified`, { method: "POST" });
            }
        }
    });
}

// 初始化
loadNotes();
checkReminders();
setInterval(checkReminders, 60000);//设置定时器，每分钟检查一次提醒