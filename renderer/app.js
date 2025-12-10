// 应用全局状态
const appState = {
    currentImage: null,
    currentFilePath: null, // 当前打开的文件路径
    canvas: null,
    ctx: null,
    slices: [],
    tolerance: 20,
    // 组合图片状态
    combineState: {
        materials: [], // 所有可用素材（上传的图片和切片）
        placedImages: [], // 已放置的图片
        grid: {
            width: 48, // 单个网格宽度
            height: 48, // 单个网格高度
            cols: 10, // 列数
            rows: 10 // 行数
        },
        isDragging: false,
        draggedMaterial: null,
        highlightCell: null
    }
};

// DOM元素
const elements = {
    canvas: document.getElementById('main-canvas'),
    placeholder: document.getElementById('canvas-placeholder'),
    openBtn: document.getElementById('open-btn'),
    exportBtn: document.getElementById('export-btn'),
    removeBgBtn: document.getElementById('remove-bg-btn'),
    toleranceSlider: document.getElementById('tolerance-slider'),
    toleranceValue: document.querySelector('.tolerance-value'),
    sliceBtn: document.getElementById('slice-btn'),
    sliceWidth: document.getElementById('slice-width'),
    sliceHeight: document.getElementById('slice-height'),
    slicePreview: document.getElementById('slice-preview'),
    sliceGrid: document.getElementById('slice-grid'),
    saveSlicesBtn: document.getElementById('save-slices-btn'),
    combineBtn: document.getElementById('combine-btn'),
    combineArea: document.getElementById('combine-area'),
    combineCanvas: document.getElementById('combine-canvas'),
    addImagesBtn: document.getElementById('add-images-btn'),
    saveCombinedBtn: document.getElementById('save-combined-btn'),
    clearGridBtn: document.getElementById('clear-grid-btn'),
    // 网格设置元素
    gridWidth: document.getElementById('grid-width'),
    gridHeight: document.getElementById('grid-height'),
    gridCols: document.getElementById('grid-cols'),
    gridRows: document.getElementById('grid-rows'),
    updateGridBtn: document.getElementById('update-grid-btn'),
    // 素材面板元素
    materialsList: document.getElementById('materials-list'),
    toggleMaterialsBtn: document.getElementById('toggle-materials-btn'),
    addMaterialsBtn: document.getElementById('add-materials-btn'),
    addSlicesBtn: document.getElementById('add-slices-btn'),
    closeMaterialsBtn: document.getElementById('close-materials-btn'),
    materialsDrawer: document.getElementById('materials-drawer'),
    // 放置区元素
    placementContainer: document.querySelector('.placement-container'),
    gridOverlay: document.getElementById('grid-overlay'),
    gridCells: document.getElementById('grid-cells'),
    // 切图预览元素
    closeSlicePreviewBtn: document.getElementById('close-slice-preview-btn'),
    slicePreview: document.getElementById('slice-preview'),
    statusText: document.getElementById('status-text')
};

// 初始化应用
function initApp() {
    // 设置画布
    appState.canvas = elements.canvas;
    appState.ctx = appState.canvas.getContext('2d');

    // 绑定事件监听器
    bindEventListeners();

    // 初始化容差值
    updateToleranceValue();

    // 设置状态栏
    updateStatus('就绪');
}

// 绑定事件监听器
function bindEventListeners() {
    // 按钮事件
    elements.openBtn.addEventListener('click', openImage);
    elements.exportBtn.addEventListener('click', exportPNG);
    elements.removeBgBtn.addEventListener('click', removeBackground);
    elements.sliceBtn.addEventListener('click', sliceImage);
    elements.saveSlicesBtn.addEventListener('click', saveAllSlices);
    // 组合图片事件
    elements.combineBtn.addEventListener('click', toggleCombineMode);
    elements.addImagesBtn.addEventListener('click', addCombineImages);
    elements.saveCombinedBtn.addEventListener('click', saveCombinedImage);
    elements.clearGridBtn.addEventListener('click', clearGrid);

    // 网格设置事件
    elements.updateGridBtn.addEventListener('click', updateGridSettings);

    // 素材添加事件
    elements.addMaterialsBtn.addEventListener('click', addCombineImages);
    elements.addSlicesBtn.addEventListener('click', addSlicesToMaterials);

    // 拖拽事件
    elements.placementContainer.addEventListener('dragover', handleDragOverPlacement);
    elements.placementContainer.addEventListener('dragenter', handleDragEnterPlacement);
    elements.placementContainer.addEventListener('dragleave', handleDragLeavePlacement);
    elements.placementContainer.addEventListener('drop', handleDropPlacement);

    // 抽屉式布局事件
    elements.toggleMaterialsBtn.addEventListener('click', toggleMaterialsDrawer);
    elements.closeMaterialsBtn.addEventListener('click', toggleMaterialsDrawer);


    // 容差滑块事件
    elements.toleranceSlider.addEventListener('input', (e) => {
        appState.tolerance = parseInt(e.target.value);
        updateToleranceValue();
    });

    // 拖拽事件
    document.addEventListener('dragover', handleDragOver);
    document.addEventListener('drop', handleDrop);

    // 菜单事件（来自主进程）
    if (window.electronAPI) {
        window.electronAPI.onMenuOpenFile(openImage);
        window.electronAPI.onMenuExportPng(exportPNG);
        window.electronAPI.onMenuRemoveBackground(removeBackground);
        window.electronAPI.onMenuSliceImage(sliceImage);
        window.electronAPI.onMenuCombineImages(toggleCombineMode);
    }
}

// 更新容差值显示
function updateToleranceValue() {
    elements.toleranceValue.textContent = `容差: ${appState.tolerance}`;
}

// 更新状态栏
function updateStatus(text) {
    elements.statusText.textContent = text;
}

// 显示/隐藏占位符
function togglePlaceholder(show) {
    elements.placeholder.style.display = show ? 'flex' : 'none';
}

// 打开图片
async function openImage() {
    try {
        const filePath = await window.electronAPI.openFile();
        if (filePath) {
            await loadImage(filePath);
        }
    } catch (error) {
        console.error('打开图片失败:', error);
        updateStatus('打开图片失败');
    }
}

// 加载图片
function loadImage(filePath) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.crossOrigin = 'anonymous';
        img.onload = () => {
            appState.currentImage = img;
            appState.currentFilePath = filePath; // 保存文件路径
            drawImageToCanvas(img);
            togglePlaceholder(false);
            updateStatus(`已打开图片: ${filePath.split('/').pop()}`);
            resolve();
        };
        img.onerror = (error) => {
            console.error('加载图片失败:', error);
            updateStatus('加载图片失败');
            reject(error);
        };
        img.src = filePath;
    });
}


// 将图片绘制到画布
function drawImageToCanvas(img) {
    // 设置画布尺寸
    appState.canvas.width = img.width;
    appState.canvas.height = img.height;

    // 清空画布
    appState.ctx.clearRect(0, 0, appState.canvas.width, appState.canvas.height);

    // 绘制图片
    appState.ctx.drawImage(img, 0, 0);

    // 隐藏切图预览和组合区域
    elements.slicePreview.style.display = 'none';
    elements.combineArea.style.display = 'none';
}

// 拖拽事件处理
function handleDragOver(e) {
    e.preventDefault();
    elements.placeholder.classList.add('dragover');
}

// 拖放事件处理
async function handleDrop(e) {
    e.preventDefault();
    elements.placeholder.classList.remove('dragover');

    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
        const imageFiles = files.filter(file => file.type.startsWith('image/'));
        if (imageFiles.length > 0) {
            await loadImage(URL.createObjectURL(imageFiles[0]));
        }
    }
}

// 去除背景
function removeBackground() {
    if (!appState.currentImage) {
        updateStatus('请先打开图片');
        return;
    }

    updateStatus('正在去除背景...');

    // 获取画布像素数据
    const imageData = appState.ctx.getImageData(0, 0, appState.canvas.width, appState.canvas.height);
    const data = imageData.data;

    // 获取左上角像素作为背景色（可以改进为点击选择背景色）
    const bgR = data[0];
    const bgG = data[1];
    const bgB = data[2];

    // 容差转成RGB差值范围
    const tolerance = appState.tolerance;

    // 遍历所有像素，将接近背景色的像素设为透明
    for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // 计算与背景色的欧几里得距离
        const distance = Math.sqrt(
            Math.pow(r - bgR, 2) +
            Math.pow(g - bgG, 2) +
            Math.pow(b - bgB, 2)
        );

        // 如果距离小于容差，设置为透明
        if (distance < tolerance) {
            data[i + 3] = 0; // 设置alpha通道为0
        }
    }

    // 将处理后的数据放回画布
    appState.ctx.putImageData(imageData, 0, 0);

    updateStatus('背景去除完成');
}

// 切图预览状态
const slicePreviewState = {
    tiles: [], // 所有图块信息 {row, col, merged: false, deleted: false, mergeGroup: null}
    mergeGroups: [], // 合并组 {id, tiles: [{row, col}], bounds: {minRow, maxRow, minCol, maxCol}}
    isSelecting: false,
    selectionStart: null,
    selectionCurrent: null,
    selectedTiles: [],
    previewCanvas: null,
    previewCtx: null
};

// 切图功能 - 显示预览
function sliceImage() {
    if (!appState.currentImage) {
        updateStatus('请先打开图片');
        return;
    }

    const sliceWidth = parseInt(elements.sliceWidth.value);
    const sliceHeight = parseInt(elements.sliceHeight.value);

    if (sliceWidth <= 0 || sliceHeight <= 0) {
        updateStatus('切图尺寸必须大于0');
        return;
    }

    // 计算切片数量
    const rows = Math.ceil(appState.canvas.height / sliceHeight);
    const cols = Math.ceil(appState.canvas.width / sliceWidth);

    // 初始化图块信息
    slicePreviewState.tiles = [];
    slicePreviewState.mergeGroups = [];
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            slicePreviewState.tiles.push({
                row: row,
                col: col,
                merged: false,
                deleted: false,
                mergeGroup: null
            });
        }
    }

    // 显示切图预览界面
    showSlicePreviewEditor(sliceWidth, sliceHeight, rows, cols);

    updateStatus('切图预览 - 拖动鼠标选择图块进行合并或删除');
}

// 显示切图预览编辑器
function showSlicePreviewEditor(sliceWidth, sliceHeight, rows, cols) {
    // 清空预览区
    elements.sliceGrid.innerHTML = '';

    // 移除结果模式类，使用全屏预览布局
    elements.sliceGrid.classList.remove('results-mode');

    // 创建主容器（垂直布局）
    const mainContainer = document.createElement('div');
    mainContainer.style.cssText = `
        display: flex;
        flex-direction: column;
        height: 100%;
        width: 100%;
        gap: 15px;
    `;

    // 添加说明文字（固定在顶部）
    const instructionDiv = document.createElement('div');
    instructionDiv.className = 'instruction-div';
    instructionDiv.innerHTML = `
        <strong>操作说明：</strong><br>
        • <strong>左键拖动</strong>：选择连续的图块进行合并
        • <strong>右键点击</strong>：删除/恢复单个图块（再次右键可恢复）
        • 松开左键后选择：<strong>合并</strong>（将选中图块合并为一个）、<strong>删除</strong>（批量删除）、<strong>取消</strong>（取消选择）<br>
        • 绿色边框：已合并的图块组 | 红色半透明：已删除的图块 | 蓝色半透明：当前选择的图块
    `;

    // 创建预览画布容器（占据剩余空间，居中显示）
    const previewContainer = document.createElement('div');
    previewContainer.style.cssText = `
        flex: 1;
        display: flex;
        justify-content: center;
        align-items: center;
        overflow: auto;
        padding: 20px;
        background-color: #1a1a1a;
        border-radius: 8px;
        border: 2px solid #333;
    `;

    // 创建预览画布
    const previewCanvas = document.createElement('canvas');
    previewCanvas.width = appState.canvas.width;
    previewCanvas.height = appState.canvas.height;
    previewCanvas.style.cssText = `
        display: block;
        cursor: crosshair;
        border: 3px solid #4CAF50;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        background-color: #fff;
        max-width: 100%;
        max-height: 100%;
        object-fit: contain;
    `;
    slicePreviewState.previewCanvas = previewCanvas;
    slicePreviewState.previewCtx = previewCanvas.getContext('2d');

    // 绘制原图
    slicePreviewState.previewCtx.drawImage(appState.canvas, 0, 0);

    // 绘制网格
    drawSliceGrid(sliceWidth, sliceHeight, rows, cols);

    // 添加鼠标事件
    previewCanvas.addEventListener('mousedown', (e) => handleSlicePreviewMouseDown(e, sliceWidth, sliceHeight, cols, rows));
    previewCanvas.addEventListener('mousemove', (e) => handleSlicePreviewMouseMove(e, sliceWidth, sliceHeight, cols));
    previewCanvas.addEventListener('mouseup', (e) => handleSlicePreviewMouseUp(e, sliceWidth, sliceHeight, cols));
    previewCanvas.addEventListener('mouseleave', () => handleSlicePreviewMouseLeave());

    // 禁用右键菜单，使用右键删除功能
    previewCanvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });


    previewContainer.appendChild(previewCanvas);

    // 创建操作按钮区（固定在底部）
    const actionsDiv = document.createElement('div');
    actionsDiv.className = 'slice-preview-actions';
    actionsDiv.style.cssText = `
        display: flex;
        gap: 15px;
        justify-content: center;
        padding: 10px 0;
    `;

    const confirmBtn = document.createElement('button');
    confirmBtn.textContent = '确认切图';
    confirmBtn.className = 'tool-btn';
    confirmBtn.style.cssText = 'padding: 12px 32px; font-size: 16px; font-weight: bold;';
    confirmBtn.onclick = () => executeSlicing(sliceWidth, sliceHeight, rows, cols);

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.className = 'tool-btn';
    cancelBtn.style.cssText = 'padding: 12px 32px; font-size: 16px; font-weight: bold;';
    cancelBtn.onclick = closeSlicePreview;

    actionsDiv.appendChild(confirmBtn);
    actionsDiv.appendChild(cancelBtn);

    // 组装布局
    mainContainer.appendChild(instructionDiv);
    mainContainer.appendChild(previewContainer);
    mainContainer.appendChild(actionsDiv);

    elements.sliceGrid.appendChild(mainContainer);

    // 显示预览区抽屉
    updateSlicePreviewDisplay();
}

// 绘制切图网格
function drawSliceGrid(sliceWidth, sliceHeight, rows, cols) {
    const ctx = slicePreviewState.previewCtx;
    const canvas = slicePreviewState.previewCanvas;

    // 重绘原图
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(appState.canvas, 0, 0);

    // 绘制已删除的图块（红色半透明）
    ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
    slicePreviewState.tiles.forEach(tile => {
        if (tile.deleted) {
            ctx.fillRect(
                tile.col * sliceWidth,
                tile.row * sliceHeight,
                sliceWidth,
                sliceHeight
            );
        }
    });

    // 绘制合并组（绿色边框）
    ctx.strokeStyle = '#00ff00';
    ctx.lineWidth = 3;
    slicePreviewState.mergeGroups.forEach(group => {
        const x = group.bounds.minCol * sliceWidth;
        const y = group.bounds.minRow * sliceHeight;
        const width = (group.bounds.maxCol - group.bounds.minCol + 1) * sliceWidth;
        const height = (group.bounds.maxRow - group.bounds.minRow + 1) * sliceHeight;
        ctx.strokeRect(x, y, width, height);
    });

    // 绘制网格线
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
    ctx.lineWidth = 1;

    // 垂直线
    for (let col = 0; col <= cols; col++) {
        ctx.beginPath();
        ctx.moveTo(col * sliceWidth, 0);
        ctx.lineTo(col * sliceWidth, canvas.height);
        ctx.stroke();
    }

    // 水平线
    for (let row = 0; row <= rows; row++) {
        ctx.beginPath();
        ctx.moveTo(0, row * sliceHeight);
        ctx.lineTo(canvas.width, row * sliceHeight);
        ctx.stroke();
    }

    // 绘制当前选择（蓝色半透明）
    if (slicePreviewState.selectedTiles.length > 0) {
        ctx.fillStyle = 'rgba(0, 100, 255, 0.3)';
        slicePreviewState.selectedTiles.forEach(tile => {
            ctx.fillRect(
                tile.col * sliceWidth,
                tile.row * sliceHeight,
                sliceWidth,
                sliceHeight
            );
        });
    }
}

// 鼠标按下事件
function handleSlicePreviewMouseDown(e, sliceWidth, sliceHeight, cols, rows) {
    const rect = slicePreviewState.previewCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / sliceWidth);
    const row = Math.floor(y / sliceHeight);

    // 检查是否在有效范围内
    if (col < 0 || col >= cols || row < 0 || row >= rows) {
        return;
    }

    // 右键点击 - 直接删除单个图块
    if (e.button === 2) {
        const tile = slicePreviewState.tiles.find(t =>
            t.row === row && t.col === col
        );

        if (tile) {
            // 切换删除状态
            tile.deleted = !tile.deleted;

            drawSliceGrid(sliceWidth, sliceHeight, rows, cols);

            if (tile.deleted) {
                updateStatus(`已删除图块 (${col}, ${row})`);
            } else {
                updateStatus(`已恢复图块 (${col}, ${row})`);
            }
        }
        return;
    }

    // 左键点击 - 开始拖动选择
    if (e.button === 0) {
        slicePreviewState.isSelecting = true;
        slicePreviewState.selectionStart = { row, col };
        slicePreviewState.selectionCurrent = { row, col };
        slicePreviewState.selectedTiles = [{ row, col }];

        drawSliceGrid(sliceWidth, sliceHeight, rows, cols);
    }
}

// 鼠标移动事件
function handleSlicePreviewMouseMove(e, sliceWidth, sliceHeight, cols) {
    if (!slicePreviewState.isSelecting) return;

    const rect = slicePreviewState.previewCanvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const col = Math.floor(x / sliceWidth);
    const row = Math.floor(y / sliceHeight);

    slicePreviewState.selectionCurrent = { row, col };

    // 计算选择区域（矩形）
    const minRow = Math.min(slicePreviewState.selectionStart.row, row);
    const maxRow = Math.max(slicePreviewState.selectionStart.row, row);
    const minCol = Math.min(slicePreviewState.selectionStart.col, col);
    const maxCol = Math.max(slicePreviewState.selectionStart.col, col);

    // 更新选中的图块
    slicePreviewState.selectedTiles = [];
    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            slicePreviewState.selectedTiles.push({ row: r, col: c });
        }
    }

    drawSliceGrid(sliceWidth, sliceHeight,
        Math.ceil(slicePreviewState.previewCanvas.height / sliceHeight),
        Math.ceil(slicePreviewState.previewCanvas.width / sliceWidth));
}

// 鼠标抬起事件
function handleSlicePreviewMouseUp(e, sliceWidth, sliceHeight, cols) {
    if (!slicePreviewState.isSelecting) return;

    slicePreviewState.isSelecting = false;

    // 如果只选择了一个图块，不显示操作菜单
    if (slicePreviewState.selectedTiles.length <= 1) {
        slicePreviewState.selectedTiles = [];
        drawSliceGrid(sliceWidth, sliceHeight,
            Math.ceil(slicePreviewState.previewCanvas.height / sliceHeight),
            Math.ceil(slicePreviewState.previewCanvas.width / sliceWidth));
        return;
    }

    // 检查选中的图块是否连续（矩形区域）
    if (!areSelectedTilesContinuous()) {
        updateStatus('只能选择连续的矩形区域');
        slicePreviewState.selectedTiles = [];
        drawSliceGrid(sliceWidth, sliceHeight,
            Math.ceil(slicePreviewState.previewCanvas.height / sliceHeight),
            Math.ceil(slicePreviewState.previewCanvas.width / sliceWidth));
        return;
    }

    // 显示操作菜单
    showTileActionMenu(e, sliceWidth, sliceHeight);
}

// 鼠标离开事件
function handleSlicePreviewMouseLeave() {
    if (slicePreviewState.isSelecting) {
        slicePreviewState.isSelecting = false;
    }
}

// 检查选中的图块是否连续
function areSelectedTilesContinuous() {
    if (slicePreviewState.selectedTiles.length === 0) return false;

    // 获取边界
    const rows = slicePreviewState.selectedTiles.map(t => t.row);
    const cols = slicePreviewState.selectedTiles.map(t => t.col);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    // 检查是否形成完整的矩形
    const expectedCount = (maxRow - minRow + 1) * (maxCol - minCol + 1);
    return slicePreviewState.selectedTiles.length === expectedCount;
}

// 显示图块操作菜单
function showTileActionMenu(e, sliceWidth, sliceHeight) {
    // 移除已存在的菜单
    const existingMenu = document.querySelector('.tile-action-menu');
    if (existingMenu) {
        existingMenu.remove();
    }

    // 创建菜单
    const menu = document.createElement('div');
    menu.className = 'tile-action-menu';
    menu.style.cssText = `
        position: fixed;
        left: ${e.clientX}px;
        top: ${e.clientY}px;
        background: #2a2a2a;
        border: 2px solid #444;
        border-radius: 4px;
        padding: 10px;
        z-index: 10000;
        box-shadow: 0 4px 12px rgba(0,0,0,0.5);
    `;

    const mergeBtn = document.createElement('button');
    mergeBtn.textContent = '合并';
    mergeBtn.className = 'tool-btn';
    mergeBtn.style.cssText = 'display: block; width: 100%; margin-bottom: 5px;';
    mergeBtn.onclick = () => {
        mergeTiles(sliceWidth, sliceHeight);
        menu.remove();
    };

    const deleteBtn = document.createElement('button');
    deleteBtn.textContent = '删除';
    deleteBtn.className = 'tool-btn';
    deleteBtn.style.cssText = 'display: block; width: 100%; margin-bottom: 5px;';
    deleteBtn.onclick = () => {
        deleteTiles(sliceWidth, sliceHeight);
        menu.remove();
    };

    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = '取消';
    cancelBtn.className = 'tool-btn';
    cancelBtn.style.cssText = 'display: block; width: 100%;';
    cancelBtn.onclick = () => {
        slicePreviewState.selectedTiles = [];
        drawSliceGrid(sliceWidth, sliceHeight,
            Math.ceil(slicePreviewState.previewCanvas.height / sliceHeight),
            Math.ceil(slicePreviewState.previewCanvas.width / sliceWidth));
        menu.remove();
    };

    menu.appendChild(mergeBtn);
    menu.appendChild(deleteBtn);
    menu.appendChild(cancelBtn);

    document.body.appendChild(menu);

    // 点击菜单外部关闭菜单
    setTimeout(() => {
        const closeMenu = (event) => {
            if (!menu.contains(event.target)) {
                menu.remove();
                document.removeEventListener('click', closeMenu);
            }
        };
        document.addEventListener('click', closeMenu);
    }, 100);
}

// 合并图块
function mergeTiles(sliceWidth, sliceHeight) {
    if (slicePreviewState.selectedTiles.length === 0) return;

    // 计算边界
    const rows = slicePreviewState.selectedTiles.map(t => t.row);
    const cols = slicePreviewState.selectedTiles.map(t => t.col);
    const minRow = Math.min(...rows);
    const maxRow = Math.max(...rows);
    const minCol = Math.min(...cols);
    const maxCol = Math.max(...cols);

    // 创建合并组
    const groupId = `merge_${Date.now()}`;
    const mergeGroup = {
        id: groupId,
        tiles: [...slicePreviewState.selectedTiles],
        bounds: { minRow, maxRow, minCol, maxCol }
    };

    slicePreviewState.mergeGroups.push(mergeGroup);

    // 更新图块状态
    slicePreviewState.selectedTiles.forEach(selectedTile => {
        const tile = slicePreviewState.tiles.find(t =>
            t.row === selectedTile.row && t.col === selectedTile.col
        );
        if (tile) {
            tile.merged = true;
            tile.mergeGroup = groupId;
        }
    });

    slicePreviewState.selectedTiles = [];

    drawSliceGrid(sliceWidth, sliceHeight,
        Math.ceil(slicePreviewState.previewCanvas.height / sliceHeight),
        Math.ceil(slicePreviewState.previewCanvas.width / sliceWidth));

    updateStatus(`已合并 ${mergeGroup.tiles.length} 个图块`);
}

// 删除图块
function deleteTiles(sliceWidth, sliceHeight) {
    if (slicePreviewState.selectedTiles.length === 0) return;

    // 更新图块状态
    slicePreviewState.selectedTiles.forEach(selectedTile => {
        const tile = slicePreviewState.tiles.find(t =>
            t.row === selectedTile.row && t.col === selectedTile.col
        );
        if (tile) {
            tile.deleted = true;
        }
    });

    const count = slicePreviewState.selectedTiles.length;
    slicePreviewState.selectedTiles = [];

    drawSliceGrid(sliceWidth, sliceHeight,
        Math.ceil(slicePreviewState.previewCanvas.height / sliceHeight),
        Math.ceil(slicePreviewState.previewCanvas.width / sliceWidth));

    updateStatus(`已标记删除 ${count} 个图块`);
}

// 执行实际的切图操作
function executeSlicing(sliceWidth, sliceHeight, rows, cols) {
    updateStatus('正在生成切片...');

    const slices = [];

    // 处理合并组
    slicePreviewState.mergeGroups.forEach(group => {
        const width = (group.bounds.maxCol - group.bounds.minCol + 1) * sliceWidth;
        const height = (group.bounds.maxRow - group.bounds.minRow + 1) * sliceHeight;

        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext('2d');

        tempCtx.drawImage(
            appState.canvas,
            group.bounds.minCol * sliceWidth,
            group.bounds.minRow * sliceHeight,
            width,
            height,
            0,
            0,
            width,
            height
        );

        slices.push({
            canvas: tempCanvas,
            row: group.bounds.minRow,
            col: group.bounds.minCol,
            index: slices.length,
            merged: true,
            rowSpan: group.bounds.maxRow - group.bounds.minRow + 1,
            colSpan: group.bounds.maxCol - group.bounds.minCol + 1
        });
    });

    // 处理未合并且未删除的单个图块
    slicePreviewState.tiles.forEach(tile => {
        if (!tile.merged && !tile.deleted) {
            const tempCanvas = document.createElement('canvas');
            tempCanvas.width = sliceWidth;
            tempCanvas.height = sliceHeight;
            const tempCtx = tempCanvas.getContext('2d');

            tempCtx.drawImage(
                appState.canvas,
                tile.col * sliceWidth,
                tile.row * sliceHeight,
                sliceWidth,
                sliceHeight,
                0,
                0,
                sliceWidth,
                sliceHeight
            );

            slices.push({
                canvas: tempCanvas,
                row: tile.row,
                col: tile.col,
                index: slices.length,
                merged: false
            });
        }
    });

    appState.slices = slices;

    // 显示切片结果预览
    showSliceResults(slices);

    updateStatus(`已生成 ${slices.length} 个切片（包含合并的图块）`);
}

// 显示切片结果
function showSliceResults(slices) {
    // 清空预览区
    elements.sliceGrid.innerHTML = '';

    // 切换到结果模式（网格布局）
    elements.sliceGrid.classList.add('results-mode');

    // 创建返回按钮容器
    const headerDiv = document.createElement('div');
    headerDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 10px; background: #1a1a1a; border-radius: 8px;';

    const titleSpan = document.createElement('span');
    titleSpan.textContent = `已生成 ${slices.length} 个切片`;
    titleSpan.style.cssText = 'color: #fff; font-size: 16px; font-weight: bold;';

    const backBtn = document.createElement('button');
    backBtn.textContent = '← 返回主界面';
    backBtn.className = 'tool-btn';
    backBtn.style.cssText = 'padding: 8px 16px; font-size: 14px;';
    backBtn.onclick = closeSlicePreview;

    headerDiv.appendChild(titleSpan);
    headerDiv.appendChild(backBtn);
    elements.sliceGrid.appendChild(headerDiv);

    // 创建切片预览项
    slices.forEach((slice, index) => {
        const sliceItem = document.createElement('div');
        sliceItem.className = 'slice-item';

        const img = document.createElement('img');
        img.src = slice.canvas.toDataURL();
        img.alt = `切片 ${index + 1}`;

        const label = document.createElement('span');
        if (slice.merged) {
            label.textContent = `合并(${slice.col},${slice.row}) ${slice.colSpan}x${slice.rowSpan}`;
        } else {
            label.textContent = `${slice.col},${slice.row}`;
        }

        sliceItem.appendChild(img);
        sliceItem.appendChild(label);
        elements.sliceGrid.appendChild(sliceItem);
    });

    // 显示预览区抽屉
    updateSlicePreviewDisplay();

    // 如果组合区域是显示的，保持显示
    if (elements.combineArea.style.display === 'block') {
        elements.combineArea.style.display = 'block';
    }
}

// 关闭切图预览
function closeSlicePreview() {
    elements.slicePreview.classList.remove('show');
    elements.slicePreview.style.display = 'none';

    // 清空预览状态
    slicePreviewState.tiles = [];
    slicePreviewState.mergeGroups = [];
    slicePreviewState.selectedTiles = [];
    slicePreviewState.isSelecting = false;

    updateStatus('已关闭切图预览');
}


// 保存所有切片
async function saveAllSlices() {
    if (appState.slices.length === 0) {
        updateStatus('没有可保存的切片');
        return;
    }

    if (!appState.currentFilePath) {
        updateStatus('无法获取源文件路径');
        return;
    }

    try {
        updateStatus('正在保存切片...');

        // 准备切片数据
        const slicesData = appState.slices.map((slice, index) => {
            let fileName;
            if (slice.merged) {
                // 合并的图块：文件名包含尺寸信息
                fileName = `slice_merged_${slice.col}_${slice.row}_${slice.colSpan}x${slice.rowSpan}.png`;
            } else {
                // 普通图块
                fileName = `slice_${slice.col}_${slice.row}.png`;
            }

            return {
                dataURL: slice.canvas.toDataURL('image/png'),
                fileName: fileName
            };
        });

        // 调用批量保存API
        const result = await window.electronAPI.saveSlices(appState.currentFilePath, slicesData);

        if (result.success) {
            updateStatus(`已保存 ${result.savedCount} 个切片到: ${result.outputDir}`);
        } else {
            updateStatus(`保存失败: ${result.error}`);
        }
    } catch (error) {
        console.error('保存切片失败:', error);
        updateStatus('保存切片失败');
    }
}

// 将DataURL保存为文件
function saveDataURLToFile(dataURL, filePath) {
    return window.electronAPI.saveDataURL(filePath, dataURL);
}

// 切换组合模式
function toggleCombineMode() {
    elements.combineArea.style.display =
        elements.combineArea.style.display === 'none' ? 'block' : 'none';

    if (elements.combineArea.style.display === 'block') {
        // 隐藏切图预览
        elements.slicePreview.style.display = 'block';
        elements.slicePreview.classList.remove('show');
        initCombineArea();
        updateStatus('已进入组合图片模式');
    }
}

// 切换素材库抽屉
function toggleMaterialsDrawer() {
    elements.materialsDrawer.classList.toggle('show');
    updateStatus(elements.materialsDrawer.classList.contains('show') ? '素材库已打开' : '素材库已关闭');
}

// 关闭切图预览抽屉
function closeSlicePreview() {
    elements.slicePreview.classList.remove('show');
    updateStatus('切图预览已关闭');
}

// 更新切图预览显示
function updateSlicePreviewDisplay() {
    elements.slicePreview.style.display = 'block';
    elements.slicePreview.classList.add('show');
}

// 重新初始化元素，确保在组合模式下所有元素都被正确获取
function reinitElements() {
    // 素材面板元素
    elements.materialsList = document.getElementById('materials-list');
    elements.toggleMaterialsBtn = document.getElementById('toggle-materials-btn');
    elements.addMaterialsBtn = document.getElementById('add-materials-btn');
    elements.addSlicesBtn = document.getElementById('add-slices-btn');
    elements.closeMaterialsBtn = document.getElementById('close-materials-btn');
    elements.materialsDrawer = document.getElementById('materials-drawer');

    // 切图预览元素
    elements.closeSlicePreviewBtn = document.getElementById('close-slice-preview-btn');
    elements.slicePreview = document.getElementById('slice-preview');

    // 绑定抽屉式布局事件
    elements.toggleMaterialsBtn.addEventListener('click', toggleMaterialsDrawer);
    elements.closeMaterialsBtn.addEventListener('click', toggleMaterialsDrawer);
    elements.closeSlicePreviewBtn.addEventListener('click', closeSlicePreview);
}

// 初始化组合区域
function initCombineArea() {
    // 重新初始化元素，确保所有元素都被正确获取
    reinitElements();

    // 初始化网格设置
    elements.gridWidth.value = appState.combineState.grid.width;
    elements.gridHeight.value = appState.combineState.grid.height;
    elements.gridCols.value = appState.combineState.grid.cols;
    elements.gridRows.value = appState.combineState.grid.rows;

    // 渲染网格
    renderGrid();

    // 渲染素材列表
    renderMaterialsList();

    // 确保素材库抽屉初始状态是隐藏的
    elements.materialsDrawer.classList.remove('show');
}

// 更新网格设置
function updateGridSettings() {
    const width = parseInt(elements.gridWidth.value);
    const height = parseInt(elements.gridHeight.value);
    const cols = parseInt(elements.gridCols.value);
    const rows = parseInt(elements.gridRows.value);

    if (width <= 0 || height <= 0 || cols <= 0 || rows <= 0) {
        updateStatus('网格参数必须大于0');
        return;
    }

    appState.combineState.grid.width = width;
    appState.combineState.grid.height = height;
    appState.combineState.grid.cols = cols;
    appState.combineState.grid.rows = rows;

    // 重新渲染网格
    renderGrid();

    updateStatus('网格设置已更新');
}

// 渲染网格
function renderGrid() {
    const { width, height, cols, rows } = appState.combineState.grid;

    // 设置画布尺寸
    elements.combineCanvas.width = cols * width;
    elements.combineCanvas.height = rows * height;

    // 更新网格覆盖层样式
    elements.gridOverlay.style.backgroundSize = `${width}px ${height}px`;

    // 清空并重新创建网格单元格
    elements.gridCells.innerHTML = '';

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const cell = document.createElement('div');
            cell.className = 'grid-cell';
            cell.style.width = `${width}px`;
            cell.style.height = `${height}px`;
            cell.style.left = `${col * width}px`;
            cell.style.top = `${row * height}px`;
            cell.dataset.col = col;
            cell.dataset.row = row;

            elements.gridCells.appendChild(cell);
        }
    }

    // 更新放置容器尺寸
    elements.placementContainer.style.width = `${cols * width + 20}px`;
    elements.placementContainer.style.height = `${rows * height + 20}px`;

    // 清空画布
    const ctx = elements.combineCanvas.getContext('2d');
    ctx.clearRect(0, 0, elements.combineCanvas.width, elements.combineCanvas.height);
}

// 添加组合图片
async function addCombineImages() {
    try {
        const filePaths = await window.electronAPI.openFiles();
        if (filePaths && filePaths.length > 0) {
            updateStatus('正在加载图片...');

            // 加载所有选中的图片
            for (const filePath of filePaths) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = filePath;
                });

                appState.combineImages.push({
                    image: img,
                    path: filePath
                });
            }

            // 更新图片列表
            updateCombineImageList();

            updateStatus(`已添加 ${filePaths.length} 张图片`);
        }
    } catch (error) {
        console.error('添加图片失败:', error);
        updateStatus('添加图片失败');
    }
}

// 渲染素材列表
function renderMaterialsList() {
    elements.materialsList.innerHTML = '';

    appState.combineState.materials.forEach((material, index) => {
        const materialItem = document.createElement('div');
        materialItem.className = 'material-item';
        materialItem.draggable = true;

        const img = document.createElement('img');
        img.src = material.src;
        img.alt = `素材 ${index + 1}`;

        const fileName = document.createElement('span');
        fileName.textContent = material.name || `素材 ${index + 1}`;

        // 添加拖拽事件
        materialItem.addEventListener('dragstart', (e) => handleDragStartMaterial(e, material));
        materialItem.addEventListener('dragend', handleDragEndMaterial);

        materialItem.appendChild(img);
        materialItem.appendChild(fileName);
        elements.materialsList.appendChild(materialItem);
    });
}

// 添加组合图片
async function addCombineImages() {
    try {
        const filePaths = await window.electronAPI.openFiles();
        if (filePaths && filePaths.length > 0) {
            updateStatus('正在加载图片...');

            // 加载所有选中的图片
            for (const filePath of filePaths) {
                const img = new Image();
                img.crossOrigin = 'anonymous';
                await new Promise((resolve, reject) => {
                    img.onload = resolve;
                    img.onerror = reject;
                    img.src = filePath;
                });

                // 添加到素材列表
                appState.combineState.materials.push({
                    id: `material_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                    src: img.src,
                    name: filePath.split('/').pop(),
                    originalImage: img
                });
            }

            // 更新素材列表
            renderMaterialsList();

            updateStatus(`已添加 ${filePaths.length} 张图片到素材库`);
        }
    } catch (error) {
        console.error('添加图片失败:', error);
        updateStatus('添加图片失败');
    }
}

// 将切片添加到素材库
function addSlicesToMaterials() {
    if (appState.slices.length === 0) {
        updateStatus('没有可添加的切片');
        return;
    }

    updateStatus('正在添加切片到素材库...');

    // 将切片添加到素材列表
    appState.slices.forEach((slice, index) => {
        const dataURL = slice.canvas.toDataURL();

        appState.combineState.materials.push({
            id: `slice_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            src: dataURL,
            name: `切片_${slice.col}_${slice.row}`,
            canvas: slice.canvas
        });
    });

    // 更新素材列表
    renderMaterialsList();

    updateStatus(`已添加 ${appState.slices.length} 个切片到素材库`);
}

// 拖拽开始处理函数
function handleDragStartMaterial(e, material) {
    e.dataTransfer.setData('text/plain', JSON.stringify(material));
    e.dataTransfer.effectAllowed = 'copy'; // 支持复制拖拽
    e.target.classList.add('dragging');
    appState.combineState.isDragging = true;
    appState.combineState.draggedMaterial = material;
}

// 拖拽结束处理函数
function handleDragEndMaterial(e) {
    e.target.classList.remove('dragging');
    appState.combineState.isDragging = false;
    appState.combineState.draggedMaterial = null;
}

// 放置区拖拽进入处理函数
function handleDragEnterPlacement(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');
}

// 放置区拖拽离开处理函数
function handleDragLeavePlacement(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    // 移除网格高亮
    if (appState.combineState.highlightCell) {
        const cell = elements.gridCells.querySelector(`[data-col="${appState.combineState.highlightCell.col}"][data-row="${appState.combineState.highlightCell.row}"]`);
        if (cell) {
            cell.classList.remove('highlighted');
        }
        appState.combineState.highlightCell = null;
    }
}

// 放置区拖拽悬停处理函数
function handleDragOverPlacement(e) {
    e.preventDefault();
    e.currentTarget.classList.add('drag-over');

    // 获取鼠标位置并高亮对应网格
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { width, height } = appState.combineState.grid;
    const col = Math.floor(x / width);
    const row = Math.floor(y / height);

    // 确保在网格范围内
    if (col >= 0 && col < appState.combineState.grid.cols && row >= 0 && row < appState.combineState.grid.rows) {
        // 移除之前的高亮
        if (appState.combineState.highlightCell) {
            const prevCell = elements.gridCells.querySelector(`[data-col="${appState.combineState.highlightCell.col}"][data-row="${appState.combineState.highlightCell.row}"]`);
            if (prevCell) {
                prevCell.classList.remove('highlighted');
            }
        }

        // 高亮当前网格
        const cell = elements.gridCells.querySelector(`[data-col="${col}"][data-row="${row}"]`);
        if (cell) {
            cell.classList.add('highlighted');
            appState.combineState.highlightCell = { col, row };
        }
    }
}

// 放置区拖拽放下处理函数
function handleDropPlacement(e) {
    e.preventDefault();
    e.currentTarget.classList.remove('drag-over');

    // 获取拖拽的数据
    const materialData = e.dataTransfer.getData('text/plain');
    if (!materialData) return;

    const material = JSON.parse(materialData);

    // 获取放置位置
    const rect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const { width, height } = appState.combineState.grid;
    const col = Math.floor(x / width);
    const row = Math.floor(y / height);

    // 确保在网格范围内
    if (col >= 0 && col < appState.combineState.grid.cols && row >= 0 && row < appState.combineState.grid.rows) {
        // 放置图片到网格
        placeImageOnGrid(material, col, row);

        // 移除高亮
        const cell = elements.gridCells.querySelector(`[data-col="${col}"][data-row="${row}"]`);
        if (cell) {
            cell.classList.remove('highlighted');
        }
        appState.combineState.highlightCell = null;
    }
}

// 在网格上放置图片
function placeImageOnGrid(material, col, row) {
    const { width: gridWidth, height: gridHeight } = appState.combineState.grid;
    const x = col * gridWidth;
    const y = row * gridHeight;

    // 创建放置的图片对象
    const placedImage = {
        id: `placed_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        material: material,
        col: col,
        row: row,
        x: x,
        y: y,
        // 保存原始尺寸信息
        originalWidth: 0,
        originalHeight: 0
    };

    // 添加到已放置图片列表
    appState.combineState.placedImages.push(placedImage);

    // 渲染放置的图片
    renderPlacedImage(placedImage);

    updateStatus('图片已放置到网格');
}

// 渲染放置的图片
function renderPlacedImage(placedImage) {
    const ctx = elements.combineCanvas.getContext('2d');

    // 创建图片对象
    const img = new Image();
    img.onload = () => {
        // 使用原始尺寸绘制图片
        placedImage.originalWidth = img.width;
        placedImage.originalHeight = img.height;

        // 绘制图片，保持原始尺寸
        ctx.drawImage(img, placedImage.x, placedImage.y);
    };
    img.src = placedImage.material.src;
}

// 清空网格
function clearGrid() {
    // 清空已放置图片列表
    appState.combineState.placedImages = [];

    // 清空画布
    const ctx = elements.combineCanvas.getContext('2d');
    ctx.clearRect(0, 0, elements.combineCanvas.width, elements.combineCanvas.height);

    updateStatus('网格已清空');
}

// 保存组合图片
async function saveCombinedImage() {
    const canvas = elements.combineCanvas;
    if (canvas.width === 0 || canvas.height === 0) {
        updateStatus('没有可保存的组合图片');
        return;
    }

    try {
        updateStatus('正在保存组合图片...');

        // 获取图片数据URL
        const dataURL = canvas.toDataURL('image/png');

        // 使用Electron的保存对话框
        const filePath = await window.electronAPI.saveFile({
            defaultPath: 'combined_image.png'
        });

        if (filePath) {
            // 将DataURL保存到文件
            await saveDataURLToFile(dataURL, filePath);
            updateStatus('组合图片保存完成');
        }
    } catch (error) {
        console.error('保存组合图片失败:', error);
        updateStatus('保存组合图片失败');
    }
}

// 导出PNG
async function exportPNG() {
    if (!appState.currentImage && appState.canvas.width === 0) {
        updateStatus('没有可导出的图片');
        return;
    }

    try {
        updateStatus('正在导出PNG...');

        // 获取图片数据URL
        const dataURL = appState.canvas.toDataURL('image/png');

        // 使用Electron的保存对话框
        const filePath = await window.electronAPI.saveFile({
            defaultPath: 'edited_image.png'
        });

        if (filePath) {
            // 将DataURL转换为Buffer并保存
            await saveDataURLToFile(dataURL, filePath);
            updateStatus('PNG导出完成');
        }
    } catch (error) {
        console.error('导出PNG失败:', error);
        updateStatus('导出PNG失败');
    }
}

// 页面加载完成后初始化应用
document.addEventListener('DOMContentLoaded', initApp);