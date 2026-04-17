function calculator() {
    return {
        inputNumber: '', // 输入的数字
        digitKey: 7, // 逐位加密密钥，默认为7
        globalKey: 12345, // 整体加密密钥，默认为12345
        operation: 'encrypt', // 操作类型：加密或解密
        originalNumber: '', // 原始数字
        digitEncrypted: '', // 逐位加密结果
        globalEncrypted: '', // 整体加密结果
        finalResult: '', // 最终结果
        decryptedResult: '', // 解密验证结果
        loading: false, // 加载状态

        init() {
            this.clear(); // 初始化清空
        },

        processNumber() {
            if (this.operation === 'encrypt') {
                this.encrypt();
            } else {
                this.decrypt();
            }
        },

        encrypt() {
            this.loading = true;
            
            // 验证输入
            if (!this.inputNumber || !/^\d+$/.test(this.inputNumber)) {
                alert('请输入有效的数字（只能包含数字0-9）');
                this.loading = false;
                return;
            }

            this.originalNumber = this.inputNumber;
            
            // 步骤1：逐位加密 - 每一位数字 + 密钥 (取模10)
            this.digitEncrypted = this.digitWiseEncrypt(this.inputNumber, this.digitKey);
            
            // 步骤2：整体加密 - 整个数字 + 整体密钥
            const digitEncryptedNum = parseInt(this.digitEncrypted);
            this.globalEncrypted = (digitEncryptedNum + this.globalKey).toString();
            
            // 最终结果就是整体加密的结果
            this.finalResult = this.globalEncrypted;
            
            // 验证：解密最终结果应该等于原始数字
            this.decryptedResult = this.decryptNumber(this.finalResult, this.digitKey, this.globalKey);
            
            this.loading = false;
            
            // 自动复制最终结果
            this.copyToClipboard(this.finalResult);
        },

        decrypt() {
            this.loading = true;
            
            // 验证输入
            if (!this.inputNumber || !/^\d+$/.test(this.inputNumber)) {
                alert('请输入有效的数字（只能包含数字0-9）');
                this.loading = false;
                return;
            }

            // 解密过程
            this.finalResult = this.inputNumber;
            this.decryptedResult = this.decryptNumber(this.inputNumber, this.digitKey, this.globalKey);
            this.originalNumber = this.decryptedResult;
            
            // 显示解密步骤
            const globalDecrypted = (parseInt(this.inputNumber) - this.globalKey).toString();
            this.globalEncrypted = globalDecrypted;
            this.digitEncrypted = globalDecrypted;
            
            this.loading = false;
            
            // 自动复制解密结果
            this.copyToClipboard(this.decryptedResult);
        },

        // 逐位加密：每一位数字 + 密钥 (取模10)
        digitWiseEncrypt(number, key) {
            return number.split('').map(digit => {
                const encrypted = (parseInt(digit) + key) % 10;
                return encrypted.toString();
            }).join('');
        },

        // 逐位解密：每一位数字 - 密钥 (处理负数情况)
        digitWiseDecrypt(number, key) {
            return number.split('').map(digit => {
                let decrypted = parseInt(digit) - key;
                // 处理负数情况：如果结果为负，加10
                if (decrypted < 0) {
                    decrypted += 10;
                }
                return decrypted.toString();
            }).join('');
        },

        // 完整解密过程
        decryptNumber(encryptedNumber, digitKey, globalKey) {
            try {
                // 步骤1：整体解密 - 减去整体密钥
                const globalDecrypted = parseInt(encryptedNumber) - globalKey;
                
                // 如果整体解密后为负数，说明输入可能有误
                if (globalDecrypted < 0) {
                    return '解密失败：数字过小';
                }
                
                // 步骤2：逐位解密 - 每一位减去逐位密钥
                // 确保结果为6位数（补前导零）
                const globalDecryptedStr = globalDecrypted.toString().padStart(6, '0');
                const result = this.digitWiseDecrypt(globalDecryptedStr, digitKey);
                
                return result;
            } catch (error) {
                return '解密失败：输入无效';
            }
        },

        clear() {
            // 清空所有输入和结果
            this.inputNumber = '';
            this.digitKey = 7;
            this.globalKey = 12345;
            this.operation = 'decrypt';
            this.originalNumber = '';
            this.digitEncrypted = '';
            this.globalEncrypted = '';
            this.finalResult = '';
            this.decryptedResult = '';
        },

        // 复制到剪贴板的方法
        async copyToClipboard(text) {
            if (!text) return;
            
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
        }
    };
}
