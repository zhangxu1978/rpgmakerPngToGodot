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
        highlightCell: null,
        // 新增选择状态
        isSelecting: false,
        selectionStart: null,
        selectedCells: [],
        cellData: []
    }
};

// DOM元素
const elements = {
    canvas: document.getElementById('main-canvas'),
    placeholder: document.getElementById('canvas-placeholder'),
    openBtn: document.getElementById('open-btn'),
    exportBtn: document.getElementById('export-btn'),
    resizeBtn: document.getElementById('resize-btn'),
    resizeWidth: document.getElementById('resize-width'),
    resizeHeight: document.getElementById('resize-height'),
    usePicaCheckbox: document.getElementById('use-pica-checkbox'),
    removeBgBtn: document.getElementById('remove-bg-btn'),
    toleranceSlider: document.getElementById('tolerance-slider'),
    toleranceValue: document.querySelector('.tolerance-value'),
    sliceBtn: document.getElementById('slice-btn'),
    autoMarkBtn: document.getElementById('auto-mark-btn'),
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
    addColBtn: document.getElementById('add-col-btn'),
    addRowBtn: document.getElementById('add-row-btn'),
    updateGridBtn: document.getElementById('update-grid-btn'),
    removeColBtn: document.getElementById('remove-col-btn'),
    removeRowBtn: document.getElementById('remove-row-btn'),
    // 素材面板元素
    materialsList: document.getElementById('materials-list'),
    toggleMaterialsBtn: document.getElementById('toggle-materials-btn'),
    addSlicesBtn: document.getElementById('add-slices-btn'),
    clearMaterialsBtn: document.getElementById('clear-materials-btn'),
    closeMaterialsBtn: document.getElementById('close-materials-btn'),
    materialsDrawer: document.getElementById('materials-drawer'),
    materialsDrawerHeader: document.querySelector('.materials-drawer-header'),
    // 放置区元素
    placementContainer: document.querySelector('.placement-container'),
    gridOverlay: document.getElementById('grid-overlay'),
    gridCells: document.getElementById('grid-cells'),
    // 切图预览元素
    slicePreview: document.getElementById('slice-preview'),
    statusText: document.getElementById('status-text'),
    // 预设导出元素
    presetSelect: document.getElementById('preset-select'),
    exportPresetBtn: document.getElementById('export-preset-btn')
};

// 拖拽状态
const dragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
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
    elements.resizeBtn.addEventListener('click', resizeImage);
    elements.removeBgBtn.addEventListener('click', removeBackground);
    elements.sliceBtn.addEventListener('click', sliceImage);
    elements.autoMarkBtn.addEventListener('click', autoMarkImages);
    elements.saveSlicesBtn.addEventListener('click', saveAllSlices);
    // 组合图片事件
    elements.combineBtn.addEventListener('click', toggleCombineMode);
    elements.addImagesBtn.addEventListener('click', addCombineImages);
    elements.saveCombinedBtn.addEventListener('click', saveCombinedImage);
    elements.clearGridBtn.addEventListener('click', clearGrid);

    // 网格设置事件
    elements.updateGridBtn.addEventListener('click', updateGridSettings);
    elements.addColBtn.addEventListener('click', addColumn);
    elements.addRowBtn.addEventListener('click', addRow);
    elements.removeColBtn.addEventListener('click', removeColumn);
    elements.removeRowBtn.addEventListener('click', removeRow);

    // 素材添加事件
    elements.addSlicesBtn.addEventListener('click', addSlicesToMaterials);
    // 清空素材库事件
    elements.clearMaterialsBtn.addEventListener('click', clearMaterials);
    // 预设导出事件
    elements.exportPresetBtn.addEventListener('click', exportPresetImage);

    // 属性面板事件
    const togglePropertiesBtn = document.getElementById('toggle-properties-btn');
    const closePropertiesBtn = document.getElementById('close-properties-btn');
    const applyPropertiesBtn = document.getElementById('apply-properties-btn');
    const propertiesPanel = document.getElementById('properties-panel');
    const propertiesHeader = document.getElementById('properties-header');
    const propertyNameInput = document.getElementById('property-name-input');
    
    if (togglePropertiesBtn) {
        togglePropertiesBtn.addEventListener('click', togglePropertiesPanel);
    }
    if (closePropertiesBtn) {
        closePropertiesBtn.addEventListener('click', togglePropertiesPanel);
    }
    if (applyPropertiesBtn) {
        applyPropertiesBtn.addEventListener('click', applySelectedProperties);
    }
    
    // 属性名称输入框事件
    if (propertyNameInput) {
        propertyNameInput.addEventListener('input', (e) => {
            currentProperties.name = e.target.value.trim() || null;
            updatePropertiesDisplay();
        });
    }

    // 属性按钮事件 - 使用更精确的事件委托
    if (propertiesPanel) {
        propertiesPanel.addEventListener('click', handlePropertyButtonClick);
        propertiesPanel.addEventListener('change', handleDropdownChange);
    }

    // 属性面板拖动事件
    if (propertiesHeader) {
        propertiesHeader.addEventListener('mousedown', startPropertiesDrag);
        document.addEventListener('mousemove', dragProperties);
        document.addEventListener('mouseup', stopPropertiesDrag);
    }

    // 拖拽事件
    elements.placementContainer.addEventListener('dragover', handleDragOverPlacement);
    elements.placementContainer.addEventListener('dragenter', handleDragEnterPlacement);
    elements.placementContainer.addEventListener('dragleave', handleDragLeavePlacement);
    elements.placementContainer.addEventListener('drop', handleDropPlacement);

    // 抽屉式布局事件
    elements.toggleMaterialsBtn.addEventListener('click', toggleMaterialsDrawer);
    elements.closeMaterialsBtn.addEventListener('click', toggleMaterialsDrawer);
    
    // 素材库拖动功能
    if (elements.materialsDrawerHeader) {
        elements.materialsDrawerHeader.addEventListener('mousedown', startDrag);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', stopDrag);
    }


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
        window.electronAPI.onMenuResizeImage(resizeImage);
        window.electronAPI.onMenuRemoveBackground(removeBackground);
        window.electronAPI.onMenuSliceImage(sliceImage);
        window.electronAPI.onMenuCombineImages(toggleCombineMode);
        window.electronAPI.onCacheCleared(() => {
            updateStatus('缓存已清除');
            // 可选：添加更多的清理操作，比如清除本地存储的数据
            console.log('应用缓存已清除');
        });
    }
}

// 更新容差值显示
function updateToleranceValue() {
    elements.toleranceValue.textContent = `容差: ${appState.tolerance}`;
}

// 自动打标功能
function autoMarkImages() {
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

    updateStatus('正在自动打标...');

    // 获取画布上下文
    const ctx = appState.ctx;
    const canvas = appState.canvas;

    // 计算行列数
    const cols = Math.ceil(canvas.width / sliceWidth);
    const rows = Math.ceil(canvas.height / sliceHeight);

    // 配置文本样式
    ctx.font = '16px Arial';
    ctx.fillStyle = '#000000';
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';

    // 绘制标记数字
    let counter = 1;
    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const x = col * sliceWidth + sliceWidth / 2;
            const y = row * sliceHeight + sliceHeight / 2;
            
            // 绘制文字轮廓（白色描边）
            ctx.strokeText(counter.toString(), x, y);
            // 绘制文字填充（黑色）
            ctx.fillText(counter.toString(), x, y);
            
            counter++;
        }
    }

    updateStatus(`自动打标完成，共标记 ${counter - 1} 个区域`);
}

// 更新状态栏
function updateStatus(text) {
    elements.statusText.textContent = text;
}

// 清空素材库
function clearMaterials() {
    // 确认是否清空
    if (confirm('确定要清空所有素材吗？此操作不可撤销。')) {
        // 清空素材数组
        appState.combineState.materials = [];
        
        // 清空素材列表显示
        elements.materialsList.innerHTML = '';
        
        // 更新状态栏
        updateStatus('素材库已清空');
    }
}

// 开始拖动素材库
function startDrag(e) {
    // 只在左键点击时触发
    if (e.button !== 0) return;
    
    const materialsDrawer = elements.materialsDrawer;
    
    // 确保素材库是打开的
    if (!materialsDrawer.classList.contains('show')) return;
    
    dragState.isDragging = true;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    
    // 获取当前元素的位置
    const rect = materialsDrawer.getBoundingClientRect();
    dragState.offsetX = e.clientX - rect.left;
    dragState.offsetY = e.clientY - rect.top;
    
    // 添加拖动样式
    materialsDrawer.classList.add('dragging');
    
    // 防止文本选择
    e.preventDefault();
}

// 拖动素材库
function drag(e) {
    if (!dragState.isDragging) return;
    
    const materialsDrawer = elements.materialsDrawer;
    
    // 计算新位置
    let newX = e.clientX - dragState.offsetX;
    let newY = e.clientY - dragState.offsetY;
    
    // 限制拖动范围，确保面板不会移出屏幕
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const panelWidth = materialsDrawer.offsetWidth;
    const panelHeight = materialsDrawer.offsetHeight;
    
    // 限制X轴位置（左右边界）
    newX = Math.max(0, Math.min(newX, windowWidth - panelWidth));
    
    // 限制Y轴位置（上下边界）
    newY = Math.max(0, Math.min(newY, windowHeight - panelHeight));
    
    // 设置新位置
    materialsDrawer.style.left = `${newX}px`;
    materialsDrawer.style.top = `${newY}px`;
    materialsDrawer.style.right = 'auto'; // 取消right定位，改用left定位
}

// 停止拖动素材库
function stopDrag() {
    if (dragState.isDragging) {
        elements.materialsDrawer.classList.remove('dragging');
        dragState.isDragging = false;
    }
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
            // 检查是否存在同名JSON文件
            const jsonPath = filePath.replace(/\.(png|jpg|jpeg|bmp)$/i, '.json');
            const jsonExists = await window.electronAPI.checkFileExists(jsonPath);
            
            if (jsonExists) {
                // 询问用户是否跳转到切图预览
                const shouldJumpToSlicePreview = confirm('发现同名的切图记录文件，是否跳转到切图预览界面？\n\n点击"确定"跳转到切图预览\n点击"取消"正常打开图片');
                
                if (shouldJumpToSlicePreview) {
                    // 加载图片和JSON数据，然后跳转到切图预览
                    await loadImageWithSliceData(filePath, jsonPath);
                    return;
                }
            }
            
            // 正常加载图片
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

// 加载图片并应用切图数据
async function loadImageWithSliceData(filePath, jsonPath) {
    try {
        // 先加载图片
        await loadImage(filePath);
        
        // 读取JSON数据
        const jsonData = await window.electronAPI.readFile(jsonPath);
        const sliceData = JSON.parse(jsonData);
        
        // 设置切图参数
        elements.sliceWidth.value = sliceData.sliceWidth;
        elements.sliceHeight.value = sliceData.sliceHeight;
        
        // 重建切图预览状态
        const rows = sliceData.rows;
        const cols = sliceData.cols;
        
        // 初始化图块信息
        slicePreviewState.tiles = [];
        slicePreviewState.mergeGroups = sliceData.mergeGroups || [];
        
        for (let row = 0; row < rows; row++) {
            for (let col = 0; col < cols; col++) {
                const tile = {
                    row: row,
                    col: col,
                    merged: false,
                    deleted: false,
                    mergeGroup: null
                };
                
                // 检查是否是删除的图块
                if (sliceData.deletedTiles) {
                    const isDeleted = sliceData.deletedTiles.some(deletedTile => 
                        deletedTile.row === row && deletedTile.col === col
                    );
                    tile.deleted = isDeleted;
                }
                
                // 检查是否是合并的图块
                slicePreviewState.mergeGroups.forEach(group => {
                    const isMerged = group.tiles.some(mergedTile => 
                        mergedTile.row === row && mergedTile.col === col
                    );
                    if (isMerged) {
                        tile.merged = true;
                        tile.mergeGroup = group.id;
                    }
                });
                
                slicePreviewState.tiles.push(tile);
            }
        }
        
        // 显示切图预览界面
        showSlicePreviewEditor(sliceData.sliceWidth, sliceData.sliceHeight, rows, cols);
        
        updateStatus(`已加载图片和切图数据，进入切图预览模式`);
        
    } catch (error) {
        console.error('加载切图数据失败:', error);
        updateStatus('加载切图数据失败，已正常打开图片');
    }
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

async function resizeImage() {
    if (!appState.currentImage && appState.canvas.width === 0) {
        updateStatus('请先打开图片');
        return;
    }

    const targetWidth = parseInt(elements.resizeWidth.value);
    const targetHeight = parseInt(elements.resizeHeight.value);

    if (!targetWidth || !targetHeight || targetWidth < 1 || targetHeight < 1) {
        updateStatus('请输入有效尺寸');
        return;
    }

    const usePica = elements.usePicaCheckbox.checked;
    
    if (usePica) {
        await resizeImageWithPica(targetWidth, targetHeight);
    } else {
        resizeImageWithNative(targetWidth, targetHeight);
    }
}

// 使用Pica库进行高质量图片压缩
async function resizeImageWithPica(targetWidth, targetHeight) {
    updateStatus('正在使用pica库进行高质量压缩...');
    
    try {
        // 创建pica实例
        const picaInstance = window.pica();

        // 创建源画布
        const sourceCanvas = document.createElement('canvas');
        sourceCanvas.width = appState.canvas.width;
        sourceCanvas.height = appState.canvas.height;
        const sourceCtx = sourceCanvas.getContext('2d');
        sourceCtx.drawImage(appState.canvas, 0, 0);

        // 创建目标画布
        const targetCanvas = document.createElement('canvas');
        targetCanvas.width = targetWidth;
        targetCanvas.height = targetHeight;

        // 使用pica进行高质量图片缩放
        await picaInstance.resize(sourceCanvas, targetCanvas, {
            width: targetWidth,
            height: targetHeight,
            quality: 5, // 最高质量等级
            alpha: true, // 支持透明通道
            unsharpAmount: 80, // 锐化量
            unsharpRadius: 0.6, // 锐化半径
            unsharpThreshold: 2 // 锐化阈值
        });

        // 将压缩后的图片绘制到主画布
        appState.canvas.width = targetWidth;
        appState.canvas.height = targetHeight;
        appState.ctx.clearRect(0, 0, targetWidth, targetHeight);
        appState.ctx.drawImage(targetCanvas, 0, 0);

        updateStatus(`pica高质量压缩完成：${targetWidth}×${targetHeight}`);
    } catch (error) {
        console.error('pica压缩失败:', error);
        updateStatus('pica压缩失败，已自动切换到原生压缩');
        resizeImageWithNative(targetWidth, targetHeight);
    }
}

// 使用原生Canvas API进行图片压缩
function resizeImageWithNative(targetWidth, targetHeight) {
    updateStatus('正在高质量平滑压缩（含可调锐化）...');

    // 参数：缩放步长与锐化强度（0 = 不锐化，1 = 全部应用）
    const scaleStep = 0.75;        // 每次缩小到 75%
    const sharpenAmount = 0.25;    // 锐化混合强度（可调：0.0 ~ 1.0）

    // --- 原始画布复制 ---
    let tempCanvas = document.createElement('canvas');
    tempCanvas.width = appState.canvas.width;
    tempCanvas.height = appState.canvas.height;
    let tempCtx = tempCanvas.getContext('2d');
    tempCtx.drawImage(appState.canvas, 0, 0);

    let curW = tempCanvas.width;
    let curH = tempCanvas.height;

    // --- 多级缩放 ---
    while (curW * scaleStep > targetWidth && curH * scaleStep > targetHeight) {
        curW = Math.max(Math.round(curW * scaleStep), targetWidth);
        curH = Math.max(Math.round(curH * scaleStep), targetHeight);

        const nextCanvas = document.createElement('canvas');
        nextCanvas.width = curW;
        nextCanvas.height = curH;
        const nextCtx = nextCanvas.getContext('2d');

        nextCtx.imageSmoothingEnabled = true;
        nextCtx.imageSmoothingQuality = 'high';
        nextCtx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, curW, curH);

        tempCanvas = nextCanvas;
    }

    // --- 最终精确缩放到目标尺寸 ---
    const finalCanvas = document.createElement('canvas');
    finalCanvas.width = targetWidth;
    finalCanvas.height = targetHeight;
    const finalCtx = finalCanvas.getContext('2d');
    finalCtx.imageSmoothingEnabled = true;
    finalCtx.imageSmoothingQuality = 'high';
    finalCtx.drawImage(tempCanvas, 0, 0, tempCanvas.width, tempCanvas.height, 0, 0, targetWidth, targetHeight);

    // --- 如果需要锐化，则对 finalCanvas 做 3x3 卷积并按 sharpenAmount 混合 ---
    if (sharpenAmount > 0) {
        try {
            const imgData = finalCtx.getImageData(0, 0, targetWidth, targetHeight);
            const src = imgData.data;
            const w = imgData.width;
            const h = imgData.height;
            const dst = new Uint8ClampedArray(src.length);

            // 3x3 锐化内核（中心 > 1）
            const kernel = [
                 0, -1,  0,
                -1,  5, -1,
                 0, -1,  0
            ];
            const ksize = 3;
            const half = Math.floor(ksize / 2);

            // 卷积（对 R,G,B 通道），A 通道直接拷贝
            for (let y = 0; y < h; y++) {
                for (let x = 0; x < w; x++) {
                    const dstIdx = (y * w + x) * 4;
                    let r = 0, g = 0, b = 0;

                    for (let ky = -half; ky <= half; ky++) {
                        const sy = Math.min(h - 1, Math.max(0, y + ky));
                        for (let kx = -half; kx <= half; kx++) {
                            const sx = Math.min(w - 1, Math.max(0, x + kx));
                            const srcIdx = (sy * w + sx) * 4;
                            const kval = kernel[(ky + half) * ksize + (kx + half)];
                            r += src[srcIdx] * kval;
                            g += src[srcIdx + 1] * kval;
                            b += src[srcIdx + 2] * kval;
                        }
                    }

                    // clamp
                    r = Math.min(255, Math.max(0, Math.round(r)));
                    g = Math.min(255, Math.max(0, Math.round(g)));
                    b = Math.min(255, Math.max(0, Math.round(b)));

                    // 混合：保持部分原始，避免过锐
                    const origR = src[dstIdx];
                    const origG = src[dstIdx + 1];
                    const origB = src[dstIdx + 2];
                    dst[dstIdx]     = Math.round(origR * (1 - sharpenAmount) + r * sharpenAmount);
                    dst[dstIdx + 1] = Math.round(origG * (1 - sharpenAmount) + g * sharpenAmount);
                    dst[dstIdx + 2] = Math.round(origB * (1 - sharpenAmount) + b * sharpenAmount);
                    dst[dstIdx + 3] = src[dstIdx + 3]; // alpha unchanged
                }
            }

            // put back
            const outImg = new ImageData(dst, w, h);
            finalCtx.putImageData(outImg, 0, 0);
        } catch (e) {
            console.warn('锐化失败，跳过锐化：', e);
            // 如果失败（比如跨域画布），就跳过锐化
        }
    }

    // --- 输出回主画布 ---
    appState.canvas.width = targetWidth;
    appState.canvas.height = targetHeight;
    appState.ctx.clearRect(0, 0, targetWidth, targetHeight);
    appState.ctx.drawImage(finalCanvas, 0, 0);

    updateStatus(`平滑高质量压缩完成：${targetWidth}×${targetHeight}`);
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

    // 添加错误显示区域
    const errorDiv = document.createElement('div');
    errorDiv.id = 'slice-preview-error';
    errorDiv.className = 'error-display';
    errorDiv.style.cssText = `
        display: none;
        background-color: #ff4444;
        color: white;
        padding: 10px;
        border-radius: 4px;
        margin: 10px 0;
        font-weight: bold;
        border: 2px solid #cc0000;
    `;

    // 创建预览画布容器（占据剩余空间，允许滚动）
    const previewContainer = document.createElement('div');
    previewContainer.style.cssText = `
        flex: 1;
        display: block;
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
        flex-wrap: wrap;
        align-items: center;
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

    // 添加预设导出组
    const presetGroup = document.createElement('div');
    presetGroup.className = 'preset-export-group';
    presetGroup.style.cssText = `
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 10px;
        background-color: #2a2a2a;
        border-radius: 8px;
        border: 2px solid #4CAF50;
    `;

    

    actionsDiv.appendChild(confirmBtn);
    actionsDiv.appendChild(cancelBtn);
    actionsDiv.appendChild(presetGroup);

    // 组装布局
    mainContainer.appendChild(instructionDiv);
    mainContainer.appendChild(errorDiv);
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
    headerDiv.style.cssText = 'display: flex; justify-content: space-between; align-items: center; margin-bottom: 15px; padding: 10px; background: #1a1a1a; border-radius: 8px; grid-column: 1 / -1;';

    const titleSpan = document.createElement('span');
    titleSpan.textContent = `已生成 ${slices.length} 个切片`;
    titleSpan.style.cssText = 'color: #fff; font-size: 16px; font-weight: bold;';

    const actionsDiv = document.createElement('div');
    actionsDiv.style.cssText = 'display: flex; gap: 10px; align-items: center;';

    const backBtn = document.createElement('button');
    backBtn.textContent = '← 返回主界面';
    backBtn.className = 'save-btn';
    backBtn.style.cssText = 'padding: 8px 16px; font-size: 14px;';
    backBtn.onclick = closeSlicePreview;
    actionsDiv.appendChild(backBtn);

    headerDiv.appendChild(titleSpan);
    headerDiv.appendChild(actionsDiv);
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

        // 准备JSON数据记录切片信息
        const sliceWidth = parseInt(elements.sliceWidth.value);
        const sliceHeight = parseInt(elements.sliceHeight.value);
        const rows = Math.ceil(appState.canvas.height / sliceHeight);
        const cols = Math.ceil(appState.canvas.width / sliceWidth);

        const jsonData = {
            sliceWidth: sliceWidth,
            sliceHeight: sliceHeight,
            rows: rows,
            cols: cols,
            mergeGroups: slicePreviewState.mergeGroups,
            deletedTiles: slicePreviewState.tiles.filter(tile => tile.deleted).map(tile => ({
                row: tile.row,
                col: tile.col
            }))
        };

        // 调用批量保存API（包含JSON数据）
        const result = await window.electronAPI.saveSlicesWithJson(appState.currentFilePath, slicesData, jsonData);

        if (result.success) {
            updateStatus(`已保存 ${result.savedCount} 个切片和JSON记录到: ${result.outputDir}`);
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
    elements.addSlicesBtn = document.getElementById('add-slices-btn');
    elements.closeMaterialsBtn = document.getElementById('close-materials-btn');
    elements.materialsDrawer = document.getElementById('materials-drawer');

    // 切图预览元素
    elements.slicePreview = document.getElementById('slice-preview');
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

// 添加列
function addColumn() {
    const currentCols = parseInt(elements.gridCols.value);
    const newCols = currentCols + 1;
    elements.gridCols.value = newCols;
    
    // 更新应用状态
    appState.combineState.grid.cols = newCols;
    
    // 重新渲染网格并保留已放置的图片
    renderGridWithPreservedImages();
    
    updateStatus('已添加一列');
}

// 添加行
function addRow() {
    const currentRows = parseInt(elements.gridRows.value);
    const newRows = currentRows + 1;
    elements.gridRows.value = newRows;
    
    // 更新应用状态
    appState.combineState.grid.rows = newRows;
    
    // 重新渲染网格并保留已放置的图片
    renderGridWithPreservedImages();
    
    updateStatus('已添加一行');
}

// 移除列
function removeColumn() {
    const currentCols = parseInt(elements.gridCols.value);
    if (currentCols <= 1) return; // 最少保留1列
    
    const newCols = currentCols - 1;
    elements.gridCols.value = newCols;
    
    // 更新应用状态
    appState.combineState.grid.cols = newCols;
    
    // 重新渲染网格并保留已放置的图片
    renderGridWithPreservedImages();
    
    updateStatus('已移除一列');
}

// 移除行
function removeRow() {
    const currentRows = parseInt(elements.gridRows.value);
    if (currentRows <= 1) return; // 最少保留1行
    
    const newRows = currentRows - 1;
    elements.gridRows.value = newRows;
    
    // 更新应用状态
    appState.combineState.grid.rows = newRows;
    
    // 重新渲染网格并保留已放置的图片
    renderGridWithPreservedImages();
    
    updateStatus('已移除一行');
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

    // 重新渲染网格并保留已放置的图片
    renderGridWithPreservedImages();

    updateStatus('网格设置已更新');
}

// 清除指定位置的图片
function clearCell(col, row) {
    const { width: gridWidth, height: gridHeight } = appState.combineState.grid;
    
    // 查找该位置的所有图片
    const imagesToRemove = appState.combineState.placedImages.filter(img => 
        img.x >= col * gridWidth && 
        img.x < (col + 1) * gridWidth && 
        img.y >= row * gridHeight && 
        img.y < (row + 1) * gridHeight
    );
    
    if (imagesToRemove.length === 0) {
        return; // 该位置没有图片
    }
    
    // 从已放置图片列表中移除
    imagesToRemove.forEach(imgToRemove => {
        const index = appState.combineState.placedImages.findIndex(img => img.id === imgToRemove.id);
        if (index !== -1) {
            appState.combineState.placedImages.splice(index, 1);
        }
    });
    
    // 重新渲染整个画布
    const ctx = elements.combineCanvas.getContext('2d');
    ctx.clearRect(0, 0, elements.combineCanvas.width, elements.combineCanvas.height);
    
    // 重新绘制所有剩余的图片
    appState.combineState.placedImages.forEach(placedImage => {
        renderPlacedImage(placedImage);
    });
    
    updateStatus('网格单元格已清空');
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
            cell.title = '右键点击清空此单元格'; // 添加提示
            
            // 添加右键点击事件
            cell.addEventListener('contextmenu', (e) => {
                e.preventDefault();
                clearCell(col, row);
            });

            // 新增：添加选择相关事件监听器
            cell.addEventListener('mousedown', (e) => {
                if (e.button === 0) { // 左键
                    startSelection(col, row);
                }
            });

            cell.addEventListener('mousemove', (e) => {
                if (appState.combineState.isSelecting) {
                    updateSelection(col, row);
                }
            });

            cell.addEventListener('mouseup', (e) => {
                if (e.button === 0) { // 左键
                    endSelection();
                }
            });

            cell.addEventListener('mouseleave', (e) => {
                if (appState.combineState.isSelecting) {
                    updateSelection(col, row);
                }
            });

            elements.gridCells.appendChild(cell);
        }
    }

    // 新增：为放置容器添加事件监听器，确保选择能正常结束
    elements.placementContainer.addEventListener('mouseup', (e) => {
        if (appState.combineState.isSelecting && e.button === 0) {
            endSelection();
        }
    });

    elements.placementContainer.addEventListener('mouseleave', () => {
        if (appState.combineState.isSelecting) {
            endSelection();
        }
    });

    // 更新放置容器尺寸
    elements.placementContainer.style.width = `${cols * width + 20}px`;
    elements.placementContainer.style.height = `${rows * height + 20}px`;

    // 清空画布
    const ctx = elements.combineCanvas.getContext('2d');
    ctx.clearRect(0, 0, elements.combineCanvas.width, elements.combineCanvas.height);
}

// 渲染网格并保留已放置的图片
function renderGridWithPreservedImages() {
    // 保存已放置的图片列表
    const preservedImages = [...appState.combineState.placedImages];
    
    // 重新渲染网格
    renderGrid();
    
    // 重新绘制所有已放置的图片
    preservedImages.forEach(placedImage => {
        renderPlacedImage(placedImage);
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
// 渲染素材列表
function renderMaterialsList() {
    elements.materialsList.innerHTML = '';

    appState.combineState.materials.forEach((material, index) => {
        const materialItem = document.createElement('div');
        materialItem.className = 'material-item';
        materialItem.draggable = true;
        materialItem.title = '右键点击移除此素材'; // 添加提示

        const img = document.createElement('img');
        img.src = material.src;
        img.alt = `素材 ${index + 1}`;

        const fileName = document.createElement('span');
        fileName.textContent = material.name || `素材 ${index + 1}`;

        // 添加拖拽事件
        materialItem.addEventListener('dragstart', (e) => handleDragStartMaterial(e, material));
        materialItem.addEventListener('dragend', handleDragEndMaterial);

        // 右键点击移除
        materialItem.addEventListener('contextmenu', (e) => {
            e.preventDefault();
            // 根据ID查找（如果存在），否则根据索引
            let idx = -1;
            if (material.id) {
                idx = appState.combineState.materials.findIndex(m => m.id === material.id);
            } else {
                // 如果没有ID（旧数据），回退到某种匹配方式或直接使用当前闭包index
                // 注意：如果数组在渲染后变动了，闭包index可能不准，但这里我们是re-render triggering，所以通常是准的
                // 最安全的是直接比对对象引用
                idx = appState.combineState.materials.indexOf(material);
            }

            if (idx > -1) {
                appState.combineState.materials.splice(idx, 1);
                renderMaterialsList();
                updateStatus('素材已移除');
            }
        });

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
                // 检查是否存在同名JSON文件
                const jsonPath = filePath.replace(/\.(png|jpg|jpeg|bmp)$/i, '.json');
                const jsonExists = await window.electronAPI.checkFileExists(jsonPath);
                
                if (jsonExists) {
                    // 询问用户是否继续编辑
                    const shouldContinueEdit = confirm(`发现图片 "${filePath.split('/').pop()}" 的组合配置文件，是否继续编辑？\n\n点击"确定"：清空网格并加载配置\n点击"取消"：正常添加图片到素材库`);
                    
                    if (shouldContinueEdit) {
                        // 加载图片
                        const img = new Image();
                        img.crossOrigin = 'anonymous';
                        await new Promise((resolve, reject) => {
                            img.onload = resolve;
                            img.onerror = reject;
                            img.src = filePath;
                        });
                        
                        try {
                            // 读取JSON配置文件
                            const jsonData = await window.electronAPI.readFile(jsonPath);
                            const combineConfig = JSON.parse(jsonData);
                            
                            // 清空网格
                            clearGrid();
                            
                            // 先还原网格配置
                            if (combineConfig.cellWidth && combineConfig.cellHeight) {
                                appState.combineState.grid.width = combineConfig.cellWidth;
                                appState.combineState.grid.height = combineConfig.cellHeight;
                                // 同时更新输入框的值
                                elements.gridWidth.value = combineConfig.cellWidth;
                                elements.gridHeight.value = combineConfig.cellHeight;
                            }
                            if (combineConfig.cols && combineConfig.rows) {
                                appState.combineState.grid.cols = combineConfig.cols;
                                appState.combineState.grid.rows = combineConfig.rows;
                                // 同时更新输入框的值
                                elements.gridCols.value = combineConfig.cols;
                                elements.gridRows.value = combineConfig.rows;
                            }
                            if (combineConfig.cellData) {
                                // 清空现有的cellData并还原配置
                                appState.combineState.cellData = [];
                                // 还原cellData
                                if (Array.isArray(combineConfig.cellData)) {
                                    appState.combineState.cellData = [...combineConfig.cellData];
                                } else if (typeof combineConfig.cellData === 'object') {
                                    // 如果是对象格式，转换为数组
                                    appState.combineState.cellData = Object.values(combineConfig.cellData);
                                }
                            }
                            
                            // 更新网格显示
                            updateGridSettings();
                            
                            // 将图片放到网格的第一个格子 (0,0)
                            const material = {
                                id: `material_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
                                src: img.src,
                                name: filePath.split('/').pop(),
                                originalImage: img
                            };
                            
                            // 直接放置到第一个格子
                            placeImageOnGrid(material, 0, 0);
                            
                            updateStatus(`已加载组合配置并将图片放置到网格第一个格子`);
                            continue; // 跳过正常的添加流程
                            
                        } catch (jsonError) {
                            console.error('读取JSON配置失败:', jsonError);
                            updateStatus('读取组合配置失败，将正常添加图片');
                            // 继续执行正常的添加流程
                        }
                    }
                }
                
                // 正常添加图片到素材库
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
    updateStatus('添加开始');
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
    // 清空单元格数据和选择状态
    if (Array.isArray(appState.combineState.cellData)) {
        appState.combineState.cellData = [];
    } else if (appState.combineState.cellData && typeof appState.combineState.cellData.clear === 'function') {
        appState.combineState.cellData.clear();
    } else {
        appState.combineState.cellData = [];
    }
    
    clearSelection();

    // 清空画布
    const ctx = elements.combineCanvas.getContext('2d');
    ctx.clearRect(0, 0, elements.combineCanvas.width, elements.combineCanvas.height);

    updateStatus('网格已清空');
}

// 开始选择单元格
function startSelection(col, row) {
    appState.combineState.isSelecting = true;
    appState.combineState.selectionStart = { col, row };
    appState.combineState.selectedCells = [{ col, row }];
    
    // 高亮选中的单元格
    highlightSelectedCells();
}

// 更新选择区域
function updateSelection(col, row) {
    if (!appState.combineState.isSelecting || !appState.combineState.selectionStart) {
        return;
    }
    
    const { selectionStart } = appState.combineState;
    
    // 计算选择区域的边界
    const minCol = Math.min(selectionStart.col, col);
    const maxCol = Math.max(selectionStart.col, col);
    const minRow = Math.min(selectionStart.row, row);
    const maxRow = Math.max(selectionStart.row, row);
    
    // 生成选中的单元格列表
    const selectedCells = [];
    for (let r = minRow; r <= maxRow; r++) {
        for (let c = minCol; c <= maxCol; c++) {
            selectedCells.push({ col: c, row: r });
        }
    }
    
    appState.combineState.selectedCells = selectedCells;
    
    // 更新高亮
    highlightSelectedCells();
}

// 结束选择
function endSelection() {
    if (!appState.combineState.isSelecting) {
        return;
    }
    
    appState.combineState.isSelecting = false;
    
    // 如果有选中的单元格，显示属性选项菜单
    if (appState.combineState.selectedCells.length > 0) {
        showCellOptions();
    }
}

// 清除选择
function clearSelection() {
    appState.combineState.isSelecting = false;
    appState.combineState.selectionStart = null;
    appState.combineState.selectedCells = [];
    
    // 移除所有高亮
    const cells = elements.gridCells.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
        cell.classList.remove('selected');
    });
}

// 高亮选中的单元格
function highlightSelectedCells() {
    // 先移除所有高亮
    const cells = elements.gridCells.querySelectorAll('.grid-cell');
    cells.forEach(cell => {
        cell.classList.remove('selected');
    });
    
    // 高亮选中的单元格
    appState.combineState.selectedCells.forEach(cell => {
        const gridCell = elements.gridCells.querySelector(`[data-col="${cell.col}"][data-row="${cell.row}"]`);
        if (gridCell) {
            gridCell.classList.add('selected');
        }
    });
}

// 显示单元格属性选项菜单
async function showCellOptions() {
    // 直接打开属性面板
    const propertiesPanel = document.getElementById('properties-panel');
    if (propertiesPanel.style.display === 'none' || propertiesPanel.style.display === '') {
        propertiesPanel.style.display = 'block';
        // 初始化下拉菜单
        await initializeDropdowns();
        updateStatus(`已选择 ${appState.combineState.selectedCells.length} 个单元格，请在属性面板中设置属性`);
    } else {
        updateStatus(`已选择 ${appState.combineState.selectedCells.length} 个单元格，请在属性面板中设置属性`);
    }
}

// 处理单元格选项选择（保留原有菜单功能）
async function handleCellOptionSelect(optionId) {
    if (appState.combineState.selectedCells.length === 0) {
        updateStatus('请先选择要设置属性的区域');
        return;
    }
    
    // 将选中的单元格坐标收集成数组
    const selectedCoords = appState.combineState.selectedCells.map(cell => ({
        col: cell.col,
        row: cell.row
    }));
    
    // 从JSON文件中查找对应的属性
    let optionProperties = null;
    try {
        const response = await fetch('./menuData.json');
        if (response.ok) {
            const menuData = await response.json();
            
            // 递归查找选项
            function findOption(items, id) {
                for (const item of items) {
                    if (item.id === id) {
                        return item;
                    }
                    if (item.submenu && item.submenu.length > 0) {
                        const found = findOption(item.submenu, id);
                        if (found) return found;
                    }
                }
                return null;
            }
            
            optionProperties = findOption(menuData, optionId);
        }
    } catch (error) {
        console.error('Failed to load menu data:', error);
    }
    
    // 如果找到了属性，使用JSON中的配置，否则使用默认逻辑
    let collision = 1;
    let navigation = 0;
    let splitType = "47tile";
    
    if (optionProperties) {
        collision = optionProperties.collision !== undefined ? optionProperties.collision : collision;
        navigation = optionProperties.navigation !== undefined ? optionProperties.navigation : navigation;
        splitType = optionProperties.splitType || splitType;
    } else {
        // 回退到原有逻辑
        if (optionId == 'ground' || optionId == 'groundDecoration') {
            collision = 0;
            navigation = 1;
        }
    }

    // 如果 cellData 是数组，直接 push 新条目；否则初始化为数组再 push
    if (!Array.isArray(appState.combineState.cellData)) {
        appState.combineState.cellData = [];
    }
    
    appState.combineState.cellData.push({
        optionId: optionId,
        collision: collision,
        navigation: navigation,
        splitType: splitType,
        cells: selectedCoords
    });
    
    // 清除选择
    clearSelection();
    
    updateStatus(`已为 ${selectedCoords.length} 个单元格设置属性: ${optionId} (碰撞:${collision}, 导航:${navigation}, 拆分:${splitType})`);
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
            
            // 生成同名JSON文件
            const jsonFilePath = filePath.replace('.png', '.json');
            
            // 准备JSON数据
            const { grid, cellData } = appState.combineState;
            const jsonData = {
                cellWidth: grid.width,
                cellHeight: grid.height,
                cols: grid.cols,
                rows: grid.rows,
                cellData: cellData
            };
            
            // 保存JSON文件
            if (window.electronAPI && window.electronAPI.writeFile) {
                const result = await window.electronAPI.writeFile(jsonFilePath, JSON.stringify(jsonData, null, 2));
                if (result && result.success) {
                    updateStatus('组合图片和属性数据保存完成');
                } else {
                    console.error('Failed to write JSON file:', result ? result.error : 'Unknown error');
                    updateStatus('组合图片保存完成，但属性数据保存失败');
                }
            } else {
                console.error('Electron writeFile API not available');
                updateStatus('组合图片保存完成，但属性数据保存失败');
            }
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

// 属性面板相关功能
let currentProperties = {
    name: null,
    collision: null,
    navigation: null,
    splitType: null,
    optionId: null
};

// 切换属性面板显示/隐藏
async function togglePropertiesPanel() {
    const propertiesPanel = document.getElementById('properties-panel');
    if (propertiesPanel.style.display === 'none' || propertiesPanel.style.display === '') {
        propertiesPanel.style.display = 'block';
        // 初始化下拉菜单
        await initializeDropdowns();
        updateStatus('属性面板已打开');
    } else {
        propertiesPanel.style.display = 'none';
        updateStatus('属性面板已关闭');
    }
}

// 处理属性按钮点击
function handlePropertyButtonClick(e) {
    if (e.target.classList.contains('property-btn')) {
        // 处理单个属性按钮
        const group = e.target.closest('.property-group');
        const buttons = group.querySelectorAll('.property-btn');
        
        // 检查当前按钮是否已经选中
        const isCurrentlyActive = e.target.classList.contains('active');
        
        if (isCurrentlyActive) {
            // 如果当前按钮已选中，取消选中
            e.target.classList.remove('active');
            
            // 重置对应的属性为null
            if (e.target.dataset.collision !== undefined) {
                currentProperties.collision = null;
            }
            if (e.target.dataset.navigation !== undefined) {
                currentProperties.navigation = null;
            }
            if (e.target.dataset.splitType !== undefined) {
                currentProperties.splitType = null;
            }
        } else {
            // 移除同组其他按钮的active状态
            buttons.forEach(btn => btn.classList.remove('active'));
            
            // 激活当前按钮
            e.target.classList.add('active');
            
            // 更新当前属性
            if (e.target.dataset.collision !== undefined) {
                currentProperties.collision = parseInt(e.target.dataset.collision);
            }
            if (e.target.dataset.navigation !== undefined) {
                currentProperties.navigation = parseInt(e.target.dataset.navigation);
            }
            if (e.target.dataset.splitType !== undefined) {
                currentProperties.splitType = e.target.dataset.splitType;
            }
        }
        
        updatePropertiesDisplay();
        
    } else if (e.target.classList.contains('quick-type-btn')) {
        // 处理快捷类型按钮
        const buttons = document.querySelectorAll('.quick-type-btn');
        buttons.forEach(btn => btn.classList.remove('active'));
        e.target.classList.add('active');
        
        // 设置快捷属性
        currentProperties.optionId = e.target.dataset.optionId;
        currentProperties.collision = parseInt(e.target.dataset.collision);
        currentProperties.navigation = parseInt(e.target.dataset.navigation);
        
        // 同步更新其他按钮状态
        updatePropertyButtonStates();
        updatePropertiesDisplay();
    }
}

// 更新属性按钮状态
function updatePropertyButtonStates() {
    const propertiesPanel = document.getElementById('properties-panel');
    if (!propertiesPanel) return;
    
    // 更新碰撞按钮（只在属性面板内查找）
    propertiesPanel.querySelectorAll('.property-btn[data-collision]').forEach(btn => {
        btn.classList.remove('active');
        if (currentProperties.collision !== null && parseInt(btn.dataset.collision) === currentProperties.collision) {
            btn.classList.add('active');
        }
    });
    
    // 更新导航按钮（只在属性面板内查找）
    propertiesPanel.querySelectorAll('.property-btn[data-navigation]').forEach(btn => {
        btn.classList.remove('active');
        if (currentProperties.navigation !== null && parseInt(btn.dataset.navigation) === currentProperties.navigation) {
            btn.classList.add('active');
        }
    });
    
    // 更新拆分类型按钮（只在属性面板内查找）
    propertiesPanel.querySelectorAll('.property-btn[data-split-type]').forEach(btn => {
        btn.classList.remove('active');
        if (currentProperties.splitType !== null && btn.dataset.splitType === currentProperties.splitType) {
            btn.classList.add('active');
        }
    });
}

// 更新属性显示
function updatePropertiesDisplay() {
    // 可以在这里添加当前属性的显示逻辑
    console.log('当前属性:', currentProperties);
}

// 应用选中的属性到选中区域
function applySelectedProperties() {
    if (appState.combineState.selectedCells.length === 0) {
        updateStatus('请先选择要设置属性的区域');
        return;
    }
    
    // 获取属性名称
    const propertyNameInput = document.getElementById('property-name-input');
    if (propertyNameInput) {
        currentProperties.name = propertyNameInput.value.trim() || null;
    }
    
    // 检查是否有设置属性
    if (currentProperties.name === null && currentProperties.collision === null && 
        currentProperties.navigation === null && currentProperties.splitType === null && 
        currentProperties.type === null) {
        updateStatus('请先选择要应用的属性或输入属性名称');
        return;
    }
    
    // 将选中的单元格坐标收集成数组
    const selectedCoords = appState.combineState.selectedCells.map(cell => ({
        col: cell.col,
        row: cell.row
    }));
    
    // 如果 cellData 是数组，直接 push 新条目；否则初始化为数组再 push
    if (!Array.isArray(appState.combineState.cellData)) {
        appState.combineState.cellData = [];
    }
    
    // 创建属性对象，将null值转换为空字符串
    const propertyData = {
        cells: selectedCoords,
        name: currentProperties.name || "",
        collision: currentProperties.collision !== null ? currentProperties.collision : "",
        navigation: currentProperties.navigation !== null ? currentProperties.navigation : "",
        splitType: currentProperties.splitType || "",
        optionId: currentProperties.optionId || ""
    };
    
    appState.combineState.cellData.push(propertyData);
    
    // 清除选择
    clearSelection();
    
    let statusMessage = `已为 ${selectedCoords.length} 个单元格应用属性`;
    if (currentProperties.name) {
        statusMessage += ` (名称: ${currentProperties.name})`;
    }
    updateStatus(statusMessage);
}

// 重置属性选择
function resetProperties() {
    currentProperties = {
        name: null,
        collision: null,
        navigation: null,
        splitType: null,
        optionId: null
    };
    
    // 移除属性面板内所有按钮的active状态
    const propertiesPanel = document.getElementById('properties-panel');
    if (propertiesPanel) {
        propertiesPanel.querySelectorAll('.property-btn, .quick-type-btn').forEach(btn => {
            btn.classList.remove('active');
        });
    }
    
    // 重置属性名称输入框
    const propertyNameInput = document.getElementById('property-name-input');
    if (propertyNameInput) {
        propertyNameInput.value = '';
    }
    
    // 重置下拉菜单
    const categorySelect = document.getElementById('category-select');
    const typeSelect = document.getElementById('type-select');
    if (categorySelect) categorySelect.value = '';
    if (typeSelect) {
        typeSelect.value = '';
        typeSelect.disabled = true;
    }
    
    updatePropertiesDisplay();
}
// 属性面板拖动相关变量
let propertiesDragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    offsetX: 0,
    offsetY: 0
};

// 初始化下拉菜单
async function initializeDropdowns() {
    try {
        const response = await fetch('./menuData.json');
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}`);
        }
        const menuData = await response.json();
        
        const categorySelect = document.getElementById('category-select');
        const typeSelect = document.getElementById('type-select');
        
        // 清空现有选项
        categorySelect.innerHTML = '<option value="">选择分类</option>';
        typeSelect.innerHTML = '<option value="">选择类型</option>';
        typeSelect.disabled = true;
        
        // 填充分类选项
        menuData.forEach(category => {
            if (category.submenu && category.submenu.length > 0) {
                const option = document.createElement('option');
                option.value = category.id;
                option.textContent = category.label;
                categorySelect.appendChild(option);
            }
        });
        
        // 存储菜单数据供后续使用
        window.menuDataCache = menuData;
        
    } catch (error) {
        console.error('Failed to load menu data:', error);
        updateStatus('加载菜单数据失败');
    }
}

// 处理下拉菜单变化
function handleDropdownChange(e) {
    if (e.target.id === 'category-select') {
        handleCategoryChange(e.target.value);
    } else if (e.target.id === 'type-select') {
        handleTypeChange(e.target.value);
    }
}

// 处理分类选择变化
function handleCategoryChange(categoryId) {
    const typeSelect = document.getElementById('type-select');
    
    // 清空类型选项
    typeSelect.innerHTML = '<option value="">选择类型</option>';
    
    if (!categoryId || !window.menuDataCache) {
        typeSelect.disabled = true;
        return;
    }
    
    // 找到选中的分类
    const selectedCategory = window.menuDataCache.find(cat => cat.id === categoryId);
    if (!selectedCategory || !selectedCategory.submenu) {
        typeSelect.disabled = true;
        return;
    }
    
    // 填充类型选项
    selectedCategory.submenu.forEach(type => {
        const option = document.createElement('option');
        option.value = type.id;
        option.textContent = type.label;
        option.dataset.collision = type.collision !== undefined ? type.collision : '';
        option.dataset.navigation = type.navigation !== undefined ? type.navigation : '';
        option.dataset.splitType = type.splitType || '';
        typeSelect.appendChild(option);
    });
    
    typeSelect.disabled = false;
}

// 处理类型选择变化
function handleTypeChange(typeId) {
    const typeSelect = document.getElementById('type-select');
    const selectedOption = typeSelect.querySelector(`option[value="${typeId}"]`);
    
    if (!selectedOption || !typeId) {
        // 如果没有选择或选择了空值，重置属性
        currentProperties.optionId = null;
        currentProperties.collision = null;
        currentProperties.navigation = null;
        currentProperties.splitType = null;
        
        // 同步更新其他按钮状态
        updatePropertyButtonStates();
        updatePropertiesDisplay();
        return;
    }
    
    // 设置快捷属性
    currentProperties.optionId = typeId;
    
    if (selectedOption.dataset.collision !== '') {
        currentProperties.collision = parseInt(selectedOption.dataset.collision);
    } else {
        currentProperties.collision = null;
    }
    if (selectedOption.dataset.navigation !== '') {
        currentProperties.navigation = parseInt(selectedOption.dataset.navigation);
    } else {
        currentProperties.navigation = null;
    }
    if (selectedOption.dataset.splitType) {
        currentProperties.splitType = selectedOption.dataset.splitType;
    } else {
        currentProperties.splitType = null;
    }
    
    // 同步更新其他按钮状态
    updatePropertyButtonStates();
    updatePropertiesDisplay();
    
    updateStatus(`已选择类型: ${selectedOption.textContent}`);
}

// 开始拖动属性面板
function startPropertiesDrag(e) {
    // 只在左键点击时触发
    if (e.button !== 0) return;
    
    const propertiesPanel = document.getElementById('properties-panel');
    
    propertiesDragState.isDragging = true;
    propertiesDragState.startX = e.clientX;
    propertiesDragState.startY = e.clientY;
    
    // 获取当前面板的位置
    const rect = propertiesPanel.getBoundingClientRect();
    propertiesDragState.offsetX = e.clientX - rect.left;
    propertiesDragState.offsetY = e.clientY - rect.top;
    
    // 添加拖动样式
    propertiesPanel.classList.add('dragging');
    
    // 防止文本选择
    e.preventDefault();
}

// 拖动属性面板
function dragProperties(e) {
    if (!propertiesDragState.isDragging) return;
    
    const propertiesPanel = document.getElementById('properties-panel');
    
    // 计算新位置
    let newX = e.clientX - propertiesDragState.offsetX;
    let newY = e.clientY - propertiesDragState.offsetY;
    
    // 限制拖动范围，确保面板不会移出屏幕
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    const panelWidth = propertiesPanel.offsetWidth;
    const panelHeight = propertiesPanel.offsetHeight;
    
    // 限制X轴位置（左右边界）
    newX = Math.max(0, Math.min(newX, windowWidth - panelWidth));
    
    // 限制Y轴位置（上下边界）
    newY = Math.max(0, Math.min(newY, windowHeight - panelHeight));
    
    // 设置新位置（取消居中定位，改用绝对定位）
    propertiesPanel.style.left = `${newX}px`;
    propertiesPanel.style.top = `${newY}px`;
    propertiesPanel.style.transform = 'none';
}

// 停止拖动属性面板
function stopPropertiesDrag() {
    if (propertiesDragState.isDragging) {
        const propertiesPanel = document.getElementById('properties-panel');
        propertiesPanel.classList.remove('dragging');
        propertiesDragState.isDragging = false;
    }
}

// 预设导出功能
async function exportPresetImage() {
    const presetName = elements.presetSelect.value;
    if (!presetName) {
        showSlicePreviewError('请选择一个预设');
        return;
    }

    if (appState.slices.length === 0) {
        showSlicePreviewError('没有可用的切片，请先进行切图');
        return;
    }

    try {
        updateStatus(`正在导出${presetName}预设图片...`);
        console.log(`开始导出预设: ${presetName}`);

        // 通过主进程读取预设JSON文件
        console.log(`尝试加载预设文件: ${presetName}.json`);
        const result = await window.electronAPI.readPresetFile(presetName);
        
        if (!result.success) {
            throw new Error(result.error);
        }
        
        const presetData = result.data;
        console.log('预设数据:', presetData);
        console.log('预设文件路径:', result.path);

        // 验证预设数据
        if (!presetData.cols || !presetData.rows || !presetData.cellData) {
            console.error('预设数据验证失败:', {
                cols: presetData.cols,
                rows: presetData.rows,
                cellDataExists: !!presetData.cellData,
                cellDataLength: presetData.cellData ? presetData.cellData.length : 0
            });
            throw new Error(`预设文件格式不正确: 缺少必要字段 (cols: ${!!presetData.cols}, rows: ${!!presetData.rows}, cellData: ${!!presetData.cellData})`);
        }

        // 创建输出画布
        const outputCanvas = document.createElement('canvas');
        const sliceWidth = parseInt(elements.sliceWidth.value);
        const sliceHeight = parseInt(elements.sliceHeight.value);
        
        // 计算每个大方块的尺寸（2x2的小方块组合）
        const cellWidth = sliceWidth * 2;
        const cellHeight = sliceHeight * 2;
        
        outputCanvas.width = presetData.cols * cellWidth;
        outputCanvas.height = presetData.rows * cellHeight;
        const outputCtx = outputCanvas.getContext('2d');

        // 清空画布
        outputCtx.clearRect(0, 0, outputCanvas.width, outputCanvas.height);

        // 创建切片位置映射表，用于快速查找
        const sliceMap = new Map();
        appState.slices.forEach(slice => {
            const key = `${slice.row}_${slice.col}`;
            sliceMap.set(key, slice);
        });

        // 遍历预设数据，组合图片
        presetData.cellData.forEach((cellIndices, index) => {
            if (!Array.isArray(cellIndices) || cellIndices.length !== 4) {
                console.warn(`预设数据第${index}项格式不正确，跳过`);
                return;
            }

            // 计算当前大方块在输出图片中的位置
            const outputCol = index % presetData.cols;
            const outputRow = Math.floor(index / presetData.cols);
            const outputX = outputCol * cellWidth;
            const outputY = outputRow * cellHeight;

            // 绘制四个小方块组成一个大方块
            cellIndices.forEach((sliceIndex, subIndex) => {
                // 将索引转换为从0开始（JSON中是从1开始）
                const actualSliceIndex = sliceIndex - 1;
                
                // 计算原始切图的行列位置（假设是按行优先顺序排列）
                const originalCols = Math.ceil(appState.canvas.width / sliceWidth);
                const sliceRow = Math.floor(actualSliceIndex / originalCols);
                const sliceCol = actualSliceIndex % originalCols;
                
                // 在切片映射表中查找对应的切片
                const sliceKey = `${sliceRow}_${sliceCol}`;
                const slice = sliceMap.get(sliceKey);
                
                if (!slice || !slice.canvas) {
                    // 如果找不到对应位置的切片，尝试直接使用索引
                    const fallbackSlice = appState.slices[actualSliceIndex];
                    if (fallbackSlice && fallbackSlice.canvas) {
                        // 使用备用切片
                        const subCol = subIndex % 2;
                        const subRow = Math.floor(subIndex / 2);
                        const subX = outputX + subCol * sliceWidth;
                        const subY = outputY + subRow * sliceHeight;
                        outputCtx.drawImage(fallbackSlice.canvas, subX, subY, sliceWidth, sliceHeight);
                    } else {
                        console.warn(`切片${sliceIndex}(位置${sliceRow},${sliceCol})不存在，跳过`);
                    }
                    return;
                }

                // 计算小方块在大方块中的位置（2x2布局）
                const subCol = subIndex % 2;
                const subRow = Math.floor(subIndex / 2);
                const subX = outputX + subCol * sliceWidth;
                const subY = outputY + subRow * sliceHeight;

                // 绘制切片到输出画布
                outputCtx.drawImage(slice.canvas, subX, subY, sliceWidth, sliceHeight);
            });
        });

        // 导出图片
        const dataURL = outputCanvas.toDataURL('image/png');
        const filePath = await window.electronAPI.saveFile({
            defaultPath: `${presetName}_export.png`
        });

        if (filePath) {
            await saveDataURLToFile(dataURL, filePath);
            updateStatus(`${presetName}预设图片导出完成: ${filePath}`);
        }

    } catch (error) {
        console.error('预设导出失败:', error);
        console.error('错误堆栈:', error.stack);
        
        // 使用新的错误显示函数
        showSlicePreviewError(error.message);
    }
}

// 结果页面的预设导出功能
async function exportPresetImageWithSelect(selectElement) {
    const presetName = selectElement.value;
    if (!presetName) {
        showSlicePreviewError('请选择一个预设');
        return;
    }

    // 临时设置主选择器的值，然后调用主导出函数
    const originalValue = elements.presetSelect.value;
    elements.presetSelect.value = presetName;
    await exportPresetImage();
    elements.presetSelect.value = originalValue;
}

// 在切图预览界面显示错误信息
function showSlicePreviewError(message) {
    // 尝试在预览界面显示错误
    const errorDiv = document.getElementById('slice-preview-error');
    if (errorDiv) {
        errorDiv.textContent = message;
        errorDiv.style.display = 'block';
        
        // 3秒后自动隐藏
        setTimeout(() => {
            errorDiv.style.display = 'none';
        }, 5000);
    }
    
    // 同时显示弹窗
    alert(`错误: ${message}`);
    
    // 更新状态栏（如果可见）
    updateStatus(message);
}