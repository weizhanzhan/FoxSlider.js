var getEle = (function (obj) {
  return function (selector, isSingle) {
    return isSingle ? obj.querySelector(selector) : obj.querySelectorAll(selector);
  }
})(window.document);


function TouchPlugin(obj) {
  /**
   * @desc 初始化函数
   */
  this.init = function () {
    //配置信息
    this.sliderContainer = getEle(obj.sliderContainer);
    this.slider = getEle(obj.slider);
    this.sliderPin = getEle(obj.sliderPin);
    this.pinClassName = obj.pinClassName;
    this.sliderBar = getEle(obj.sliderBar);
    this.pin = getEle(obj.pin);
    this.autoScrollInterval = null;

    for (var i = 0; i < this.slider.length; i++) {
      this.slider[i].querySelector('img').setAttribute('ondragstart', 'return false');
    }
    //改变屏幕尺寸会刷新的配置参数
    this.refreshParam();
    //事件绑定
    this.testTouchEvent();
    this.bindTouchEvent(this.sliderContainer[0], obj.callback, false);
    this.resize();
    this.bindSpinClick();
    this.autoRun();
  }


  /**
   * @desc 刷新参数
   * @param {number} totalMoveLen 滚动位移
   * @param {number} spinIndex 轮播指标高亮下标
   */
  this.refreshParam = function (totalMoveLen, spinIndex) {
    this.preX = 0; //鼠标点击或开始触摸屏幕时的坐标X
    this.curX = 0; //鼠标移动或触摸移动时的坐标X
    this.totalMoveLen = totalMoveLen || 0; // 记录上一次移动的坐标X总值
    this.hasmoveLen = 0; //当前触摸或鼠标移动事件的已经移动的坐标X值
    this.isNeedRebindTag = false; //滑动过程中是否达到需要重新绑定事件的界限
    this.dir = 0; //鼠标或触摸移动的方向 大于0 向右， 小于0 向左 等于0 无左右移动
    this.sliderW = Math.floor(this.slider[0].offsetWidth); //轮播容器内的每一屏的宽度
    this.removeClsName(this.pin, 'on');
    this.setClsName(this.pin[spinIndex || 0], 'on');
    this.sliderBar[0].style.cssText = 'transition:all ease-in-out .22s;transform:translateX(' + (totalMoveLen || 0) + 'px)';
  }


  /**
   * @desc 改变屏幕尺寸重置参数
   */
  this.resize = function () {
    var that = this;
    if (window.addEventListener) {
      window.addEventListener('resize', function (ev) {
        console.log("resize chrome");
        that.refreshParam();
        that.bindTouchEvent(that.sliderContainer, obj.callback, false);
        that.autoRun();
      }, false)
    } else {
      window.attachEvent('resize', function (ev) {
        console.log("resize IE");
        that.refreshParam();
        that.bindTouchEvent(that.sliderContainer, obj.callback, false);
        that.autoRun();
      })
    }
  }


  /**
   * @desc 自动轮播
   * @param {number} time 轮播时间
   * @param {number} initStep spin下标 和下一屏
   */
  this.autoRun = function (time, initStep) {
    var that = this;
    var stepLen = that.sliderW;
    var step = initStep || 0;
    clearInterval(that.autoScrollInterval);
    that.autoScrollInterval = setInterval(function () {
      that.refreshParam(-stepLen * step, step);
      step++;
      if (step >= that.slider.length) {
        step = 0;
      }

    }, time || 3000);
  }

  /**
   * @desc 判断鼠标或触摸移动的方向
   * @param {number} curX  鼠标点击或开始触摸屏幕时的坐标X
   * @param {number} preX 鼠标移动或触摸移动时的坐标X
   */
  this.judgeDir = function (curX, preX) {
    return curX - preX > 0 ? 1 : curX - preX < 0 ? -1 : 0;
  };

  /**
   * @desc 检测当前设备支持的事件（鼠标点击移动和手触摸移动）
   */
  this.testTouchEvent = function () {
    if ("ontouchstart" in window) {
      this.eventStart = "ontouchstart";
      this.eventEnd = "ontouchend";
      this.eventMove = "ontouchmove";
    } else {
      this.eventStart = "onmousedown";
      this.eventEnd = "onmouseup";
      this.eventMove = "onmousemove";
    }
    console.log("初始化完成")
  };

  /**
   * @desc 获取鼠标横坐标位置
   * @param {Event} event 事件对象
   */
  this.mouseX = function (event) {
    event = event || window.event;
    let x = event.clientX || event.pageX || event.touches[0].clientX || event.touches[0].pageX;
    return x;
  };


  /**
   * @desc 取消绑定触摸或鼠标点击移动事件
   * @param {Object} domNode 需要被取消绑定事件节点对象
   */
  this.cancelBind = function (domNode) {
    domNode[this.eventStart] = null;
    domNode[this.eventEnd] = null;
    domNode[this.eventMove] = null;
  }

  /**
   * @desc 重新绑定触摸事件
   * @param {Object} domNode 需要被绑定事件节点对象
   * @param {function} callback 回调方法
   * @param {boolean} isUnbind 是否取消绑定
   */
  this.reBindTouchEvent = function (domNode, callback, isUnbind) {
    var that = this;
    setTimeout(function () {
      that.bindTouchEvent(domNode, callback, isUnbind);
    }, 1000)
  }

  /**
   * @desc 移除节点的样式类名
   * @param {Array} nodeList 被移除样式的节点数组
   * @param {string} clsName 移除的样式类名称
   */
  this.removeClsName = function (nodeList, clsName) {
    for (var i = 0; i < nodeList.length; i++) {
      nodeList[i].classList.remove(clsName);
    }
  };

  /**
   * @desc 添加样式
   * @param {Object} node 添加类名的节点
   * @param {string} clsName 样式类名
   */
  this.setClsName = function (node, clsName) {
    node.classList.add(clsName);
  }

  /**
   * @desc 点击轮播spin 切换屏
   */
  this.bindSpinClick = function () {
    var that = this;
    for (var i = 0; i < that.pin.length; i++) {
      (function (sub) {
        that.pin[sub].onclick = function (ev) {
          ev.stopPropagation();
          that.refreshParam(-sub * that.sliderW, sub);
          that.autoRun(3000,sub);
        }
      })(i);
    }
  }
  
  /**
   * @desc 通过检测dom节点是否包含某个样式名来判断是否属于目标target
   * @param {Object} domNode 
   * @param {string} clsName 
   */
  this.checkTargetByCls = function(domNode, clsName){
    return domNode.classList.contains(clsName);
  }

  /**
   * 
   * @param {Object} domNode 绑定事件的代理对象
   * @param {function} callback 回调方法
   * @param {boolean} isUnbind 是否取消绑定 
   */
  this.bindTouchEvent = function(domNode, callback, isUnbind) {
    var that = this;
    if (!domNode) return;
    if (isUnbind) {
      that.cancelBind(domNode);
      return;
    }
    domNode[that.eventStart] = function(ev) {
      ev = ev || window.ev;
      clearInterval(that.autoScrollInterval);
      that.preX = that.mouseX(ev);
      domNode[that.eventMove] = typeof callback == "function" ? function(ev) {
        that.removeClsName(that.pin, "on");
        that.curX = that.mouseX(ev);
        that.dir = that.judgeDir(that.curX, that.preX);
        that.hasmoveLen = that.totalMoveLen + that.curX - that.preX;
        callback( ev, that.dir, Math.round(that.hasmoveLen / that.sliderW) );
        that.sliderBar[0].style.cssText = "transition:all linear .13s;transform:translateX(0px)";
        
        //轮播边界判定 小于第一屏
        if (that.hasmoveLen / that.sliderW > 0.2) {
          that.hasmoveLen = -(that.slider.length - 1) * that.sliderW;
          that.isNeedRebindTag = true;
        }
        //轮播边界判定 大于最后一屏
        if ( that.hasmoveLen / that.sliderW < -(that.slider.length - 0.8) ) {
          that.hasmoveLen = 0;
          that.isNeedRebindTag = true;
        }
        that.sliderBar[0].style.cssText = "transition:all ease-in-out .22s;transform:translateX(" + that.hasmoveLen + "px)";
        var pinNode = that.pin[ Math.round(Math.abs(that.hasmoveLen / that.sliderW)) ];
        that.setClsName(pinNode, "on");
        //检测当移动事件对象是否发生在合法对象上。
        if (ev.target.tagName !== 'IMG') {
          domNode[that.eventEnd]();
          return;
        }
        //当达到要重新绑定事件时的条件触发（轮播屏达到边界）
        if (that.isNeedRebindTag) {
          that.cancelBind(domNode);
          that.totalMoveLen =
            that.dir > 0 ? -(that.slider.length - 1) * that.sliderW : 0;
          that.isNeedRebindTag = false;
          that.reBindTouchEvent(domNode, callback, isUnbind);
        }
      } : null;
    };
    domNode[that.eventEnd] = function(ev) {
      ev  = ev || window.event;
      domNode[that.eventMove] = null;
      if(that.checkTargetByCls(ev.target, 'pin')){
        return;
      }
      var num = Math.round(that.hasmoveLen / that.sliderW);
      num = num > 0 ? -that.slider.length + 1 : num;
      num = num < -(that.slider.length - 1) ? 0 : num;
      that.sliderBar[0].style.cssText = "transition:all ease-in-out .22s;transform:translateX(" + num * that.sliderW + "px)";
      that.totalMoveLen = num * that.sliderW;
      that.autoRun( 3000, Math.round(Math.abs(that.hasmoveLen / that.sliderW)) );
    };
  };

  this.init();
}