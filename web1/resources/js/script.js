function calculator() {
    return {
        number: '', // 输入的数字
        shift: 12, // 默认移位数
        base: '10', // 默认进制为十进制
        method: '>>', // 默认运算方法为右移
        padding: 0, // 新位补数，默认补0
        binOriginal: '', // 原二进制数
        binResult: '', // 结果二进制数
        hexOriginal: '', // 原十六进制数
        hexResult: '', // 结果十六进制数
        decOriginal: '', // 原十进制数
        decResult: '', // 结果十进制数
        loading: false, // 添加加载状态

        init() {
            this.clear(); // 初始化清空
        },

        calculate() {
            this.loading = true; // 开始加载
            // 将输入的原数解析为十进制
            let originalValue = parseInt(this.number, this.base);

            if (isNaN(originalValue)) {
                alert('请输入有效数字'); // 如果输入无效，则弹出提示
                this.loading = false; // 结束加载
                return;
            }

            // 保存原始值
            this.decOriginal = originalValue;
            this.binOriginal = originalValue.toString(2).padStart(8, '0'); // 转换为二进制，至少8位
            this.hexOriginal = originalValue.toString(16).toUpperCase(); // 转换为十六进制

            let result;

            // 根据选择的运算方式执行左移或右移
            if (this.method === '>>') {
                // 右移运算，使用自定义右移逻辑
                result = this.rightShift(originalValue, this.shift);
            } else if (this.method === '<<') {
                // 左移运算，使用自定义左移逻辑
                result = this.leftShift(originalValue, this.shift);
            }

            // 更新结果
            this.decResult = result; // 十进制结果
            this.binResult = this.formatBinaryResult(result); // 结果二进制数
            this.hexResult = result.toString(16).toUpperCase(); // 十六进制结果
            this.loading = false; // 结束加载

            // 自动复制十进制结果
            this.copyToClipboard(this.decResult);
        },

        leftShift(value, shift) {
            // 左移运算，低位补0或1
            let binaryString = value.toString(2).padStart(8, '0');
            let shifted = binaryString.slice(shift) + ''.padEnd(shift, this.padding === 0 ? '0' : '1'); // 移除高位，低位补指定的值
            return parseInt(shifted, 2); // 转回十进制
        },

        rightShift(value, shift) {
            // 右移运算，高位补0或1
            let binaryString = value.toString(2).padStart(8, '0');
            let shifted = ''.padStart(shift, this.padding === 0 ? '0' : '1') + binaryString.slice(0, binaryString.length - shift); // 高位补指定的值，移除低位
            return parseInt(shifted, 2); // 转回十进制
        },

        formatBinaryResult(result) {
            // 将结果转换为二进制并填充为8位
            return result.toString(2).padStart(8, '0');
        },

        clear() {
            // 清空所有输入和结果
            this.number = '';
            this.shift = 12;
            this.base = '10';
            this.method = '>>';
            this.padding = 0;
            this.decOriginal = '';
            this.decResult = '';
            this.binOriginal = '';
            this.binResult = '';
            this.hexOriginal = '';
            this.hexResult = '';
        },

        // 添加复制到剪贴板的方法
        async copyToClipboard(text) {
            if (!text) return; // 如果文本为空则不执行复制
            
            try {
                await navigator.clipboard.writeText(text);
                
                // 获取点击的元素
                const element = event.currentTarget;
                
                // 添加复制成功的视觉反馈
                element.classList.add('copied');
                
                // 1秒后移除复制成功的样式
                setTimeout(() => {
                    element.classList.remove('copied');
                }, 1000);
            } catch (err) {
                console.error('复制失败:', err);
            }
        },

        // 仪器使用按钮功能 - 设置移位数为10并计算
        useInstrument() {
            this.shift = 10; // 设置移位数为10
            if (this.number && this.base && this.method) {
                this.calculate(); // 如果有有效输入则自动计算
            }
        },

        // 试剂包使用按钮功能 - 设置移位数为12并计算
        useReagent() {
            this.shift = 12; // 设置移位数为12
            if (this.number && this.base && this.method) {
                this.calculate(); // 如果有有效输入则自动计算
            }
        }
    };
}
