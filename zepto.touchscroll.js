(function(win,undefined){
	/*
	 * ChildClass= Class.extend({
	 * 					init: function(options){
	 *						this.run= function(){
	 * 							console.log('is run');
	 *						}
	 * 					}
	 * 				});
	 *
	 * grandsonChild= ChildClass.extend({
	 *			 init: function(options){
	 *			 	this._super(options); 
	 *            }
	 *
	 *			 annotation：一只柯楠
	 *});
	 *
	 */

	var initializing = false,
		superTest = /vnice/.test(function () {vnice;}) ? /\b_super\b/ : /.*/;
	this.Class = function () {};

	Class.extend = function (prop) {
		//_super和prototype:new建立一个新的对象，作为新类的prototype，不能直接在上面添加方法，会影响其他使用extend方法返回的类
		var _super = this.prototype;
		//设为true就不再执行init方法
		initializing = true;
		var prototype = new this();
		initializing = false;
		//将传进来的prop对象里的方法拷贝到prototype上面去
		for (var name in prop) {
			prototype[name] = (typeof prop[name] === 'function' && typeof _super[name] === 'function' && superTest.test(prop[name])) ? (function (name, fn) {
			//这一步为了实现，prop里面的某个方法（如prop.init）和原型prototype方法中的方法冲突时，可以在方法中调用【this._super()】，这里将this._super方法替换成原型中的这个方法(prototype.init).
					return function () {
						var temp = this._super;	
						this._super = _super[name];
						var ret = fn.apply(this, arguments);
						this._super = temp;
						return ret;
					}
				})(name, prop[name]) : prop[name];
		}
		
		function Class () {
			//构造函数中默认调用this.init方法
			if (!initializing && this.init) {
				this.init.apply(this, arguments);
			}
		}
		//让将要返回的类继承prototype
		Class.prototype = prototype;
		//将类的构造函数设为Class
		Class.constructor = Class;
		//将类添加extend方法，方便继续继承
		Class.extend = arguments.callee;
		//返回构造函数
		return Class;
	};
})(window,undefined);

(function($){
/**
 *css3 Touch Scroll，此版本在放假期间开发中，仅在测试了chrome浏览器和iphone中测试了。。。
 *
 * @author: 一只柯楠
 * 
 * @param	{Object}	options;
 * @config   {zepto}     options.$el    		//外围容器 选择器或者element
 * @config	 {array}     options.pages			//填充每一页的内容 Element || string || function
 * @config	 {Number}    options.animTime	 	//动画时间，默认为500	
 * @config	 {Function}  options.beforechange 	//动画完成之前回调函数	
 * @config	 {Function}  options.afterchange 	//动画完成之后回调函数	
 * @isFollow {Boolean}	obtions.isFollow	 	//是否跟随,默认false
 * @isFollow {Boolean}	obtions.loop	 		//自动循环的时间/ms
 * 
 * 
 */

//默认参数
var defaultData= {
		isFollow: false,
		animTime: 500,
		curIndex: 0,			//当前索引
		_wrapLeftIndex: 0,		//是外围动画节点的移动单位距离
		loop: 0,
		loopDir: 1,
		pages: [],
		lazyLoad: false,
		beforechange: function(){
		},
		afterchange: function(){
		},
	},
	$doc= $(document),
	TouchScroll= Class.extend({
		//顾名思义
		init:function(options){
			this.$el= $(options.$el);
			this.options= $.extend(defaultData, options);
			this.options._lazyLoad= !this.options.loop && this.options.lazyLoad;
			this._wrapLeftIndex= this.options._wrapLeftIndex;
			this.curIndex= this.options.curIndex;
            this.options.beforechange(this.curIndex);
			this._initNodes();
            this.options.afterchange(this.curIndex);
			var self=this, loop= self.options.loop;
			self.touchEnabled= true;
			this.options.isFollow ? this.initTouchFollow() : this.initTouch();
			var /*t=0,tm,*/ _resizeListener, _bodyEventListener;
			this.$container[0].addEventListener('webkitTransitionEnd', self, false);
			this._resizeListener= _resizeListener= this.delay(function(e){
					//当隐藏时，不执行;
					if(!self.$el[0].offsetHeight)
						return;
					setTimeout(function(){
						self.refreshPos();
					}, 500)
					if(loop)
						self.startAutoLoop()
			}, 300);
			addEventListener('onorientationchange' in window ?
				'orientationchange' : 'resize', _resizeListener);
			
			if(this.options.loop){
				var dirfoo= self.options.loopDir < 0 ? 'toLeft' : 'toRight', timeoutid, touchEv= this.touchEv;
				this._bodyEventListener= _bodyEventListener= function(e){
					self[(touchEv.START_EV===e.type ? 'stop' : 'start') +'AutoLoop']();
				}
				$doc.on(touchEv.START_EV+' '+touchEv.END_EV, _bodyEventListener)
				self.stopAutoLoop= function(){
					if(timeoutid){
						clearTimeout(timeoutid);
						timeoutid= null;
					}
					return this;
				};
				self.startAutoLoop= function(){
					self.stopAutoLoop();
					timeoutid= setTimeout(function(){
						timeoutid= null;
						//当隐藏时，不执行;
						if(self.$el[0].offsetHeight)
							self[dirfoo]();
					}, self.options.loop)
					return this;
				};
				self.startAutoLoop();
			}
			return this;
		},

		
		_initNodes: function(){
			var i= 0, nodes, length, left, contentWidth= this._contentWidth= this.options.width || this.$el[0].clientWidth, self= this,
				reg= /<\//g,
				lazyLoad= self.options._lazyLoad,
				curIndex= self.curIndex,
				html= this.$el.html(); 
				if(!html.trim()){
				    for(var num=0;num <　this.options.pages.length; num++){
				        html+= '<div></div>';
				    }
				}
			html= html.replace(reg, function($a){
				return (!lazyLoad || i=== curIndex ? self.getPage(i++) : '') +$a;
			});
			this.$el.html('<div  style="display: -webkit-box;-webkit-transform: translate3d('+curIndex+'px, 0px, 0px);-webkit-user-select: none;-webkit-transition: -webkit-transform '+this.options.animTime+'ms cubic-bezier(0, 0, 0.25, 1)">'+
					html
					+'</div>');
			this.$container= this.$el.children();
			nodes= this.nodes= this.$container.children();
			this.maxIndex= (length= this.nodesLength= nodes.length) -1;
			
			var bestDest= Math.ceil(length/2);
			var nodesAry= self._nodes=[];
			nodes.forEach(function(node, index){
				left= index< bestDest ? index:  -(length- index);
				nodesAry.push({node: node, left: left, index: index});
				node.style.cssText+= ';-webkit-transform: translate(-'+(index)+'00%, 0) translate3d('+left*contentWidth+'px, 0px, 0px);';
			});
			
			nodesAry.sort(function(a, b){
				return a.left- b.left;
			});
			//转到对应页
			this.curIndex= 0;
			this.move(curIndex, 0);
			return this;
		},
       //设为cotainer和nodes的位置,无动画
		refreshPos: function(){
			var contentWidth= this._contentWidth= this.$el[0].clientWidth, self= this;
			this.setNodeLeft(this.$container[0], this._wrapLeftIndex * contentWidth)
			this._nodes.forEach(function(val,index){
				self.setNodeLeft(val.node, val.left* contentWidth);
			});
			return this;

		},
		
		setNodeLeft: function(ele, left){
			var style= ele.style;
			style.webkitTransform= style.webkitTransform.replace(/translate3d\(([-\d]+)px/g, 'translate3d\('+
				left
			+'px');
			return this;
		},
        /*
         * 重新排列数组，重新设置nodes位置
         */
		_setNodesTranslate: function(dir){
			var into,
				out,
				bestLeft,
				nodes= this._nodes,
				node,
				contentWidth= this._contentWidth,
				maxIndex=this.nodesLength-1,
				curIndex= this.curIndex,
				curpage;
			if(dir==0)
				return;
			if(dir<0){
				into= 'unshift';
				out= 'pop';
				bestLeft= nodes[0].left -1;
			}else{
				into= 'push';
				out= 'shift';
				bestLeft= nodes[maxIndex].left+ 1;
			}
			node= nodes[out]();
			node.left= bestLeft;
			nodes[into](node);
    		this.setNodeLeft(node.node, bestLeft* contentWidth);
			return this;
		},

		toLeft: function(){
			return this.move(this.curIndex-1);
		},

		toRight: function(){
			return this.move(this.curIndex+1);
		},

		toCurrent: function(){
			return this.move(this.curIndex);
		},

		getPage: function(index){
			var page= this.options.pages[index];
			return $.isFunction(page) ? page() : page instanceof Element ? page.outerHTML : page;
		},

		handleEvent: function(e){
			if(e.type==='webkitTransitionEnd'){
				this.options.afterchange(this.curIndex);
				this.touchEnabled= true;
				if(this.options.loop){
					this.startAutoLoop();
				}
			}
		},

		move: function(index, anim){
			var left= this._wrapLeftIndex= this._wrapLeftIndex + (this.curIndex- index), res, curIndex,
			curIndex= index < 0 ? this.maxIndex : index > this.maxIndex ? 0 : index;
            var len= this.curIndex- index, dir= len >0 ? -1: 1, self= this;
		
			//有改变
			if(len){
    			if(this.options._lazyLoad){
    				curpage= this.nodes[curIndex];
    				!curpage.firstElementChild && (curpage.innerHTML= this.getPage(curIndex));
    			}   
    			this.curIndex= curIndex;
    			this.options.beforechange(curIndex);
			}
			while(len){
			    len+= dir;
			    this._setNodesTranslate(dir);
			}
			
			this.setAnimTime(anim).setNodeLeft(this.$container[0], left * this._contentWidth)
			setTimeout(function(){
			    self.setAnimTime(0);
			});
			return this;
		},

		setAnimTime: function(anim){
			anim=anim===undefined ? this.options.animTime : anim;
			this.$container.css('-webkit-transition', '-webkit-transform '+anim+'ms cubic-bezier(0, 0, 0.25, 1)');
			return this;
		},
		/*
		 *fn= delay(function(){}, 250);
		 */
		delay: function (run, time){
			var _timer, _lock;
			var foo= function(){
				clearTimeout(_timer);
				if(_lock){
					//锁定时进入，延时time来执行foo
					_timer= setTimeout(foo, time);
				}else{
					//首次直接执行，并且锁定time时间
					_lock= true;
					run();
					setTimeout(function(){_lock= false;}, time);
				}
			}
			return foo;
		},

		//一看就懂,虽然写了mosedown,不过并没有兼容鼠标事件，需要开启chrome调试器中点选EMULATE TOUCH EVENTS 
		touchEv:(function(){
			var isTouchPad = (/hp-tablet/gi).test(navigator.appVersion),
			hasTouch='ontouchstart' in window && !isTouchPad;
			return {
				hasTouch:hasTouch,
				START_EV:hasTouch ? 'touchstart' : 'mousedown',
				MOVE_EV:hasTouch ? 'touchmove' : 'mousemove',
				END_EV:hasTouch ? 'touchend' : 'mouseup'
			}
		})(),
		//不跟随手指动画注册
		initTouch:function(){
			var now=null,
				touch={},
				self=this,
				timeout,
				touchEv=this.touchEv;
			this.$el.on(touchEv.START_EV,function(e){
				if(!self.touchEnabled)
					return ;
				
				if(!e.touches || e.touches.length!==1)
					return ;
				touch.x1= e.touches[0].clientX;
				touch.y1= e.touches[0].clientY;

				
				timeout=setTimeout(function(){
					timeout=null;
				},800);
			}).on(touchEv.MOVE_EV,function(e){

				if(!self.touchEnabled || !e.touches)
					return ;
				if(timeout){
					touch.x2= e.touches[0].clientX;
					touch.y2= e.touches[0].clientY;
					dir=self.swipeDirection(touch.x1,touch.x2,touch.y1,touch.y2);
					if(dir=='Left' || dir=='Right')
						e.preventDefault();	
				}
			})
			self._touchEndListener= function(e){
				if(!self.touchEnabled)
					return;
				if(timeout && touch.x2 && Math.abs(touch.x1 - touch.x2) > 5){
					self.touchEnabled= false;
					if(dir=='Left'){
						self.toRight();
					}else if(dir=='Right'){
						self.toLeft();
					}
				};
				touch={};
			};
			$doc.on(touchEv.END_EV, self._touchEndListener);
			return this;
		},
		//跟随手指动画注册
		initTouchFollow:function(){
			var touchEv=this.touchEv,
				self=this,
				scrolling=null,
				startX=0,
				startY=0,
				moveX=0,
				moveY=0,
				baseX=0,
				distX,
				newX,
				dir=0,
				currentLeft= 0,
				container= this.$container[0],
				transX;

			this.$el.on(touchEv.START_EV,function(e){
				if(!e.touches|| !self.touchEnabled && e.touches.length!=1 )
					return ;
				if(!touchEv.hasTouch)
					e.preventDefault();
				self.setAnimTime(0);
				scrolling=true;
				moveRead=false;
				startX=e.touches[0].clientX;	
				startY=e.touches[0].clientY;	
				baseX=startX;
				newX= self._wrapLeftIndex* self._contentWidth;
				dir=0;
			}).on(touchEv.MOVE_EV,function(e){
				if(!e.touches || !scrolling || !self.touchEnabled)
					return ;
				var moveX=e.touches[0].clientX,
					moveY=e.touches[0].clientY;	
				if(moveRead){
					distX=moveX-baseX;
					self.setNodeLeft(container, newX+=distX);
					dir= distX>0 ? 1 : -1;
					baseX=moveX;
				}else{
					var changeX=Math.abs(moveX-startX),
						changeY=Math.abs(moveY-startY);
					if((changeX/changeY)>1){
						e.preventDefault();
						e.stopPropagation();
						moveY= null;
						moveRead=true;
					}else if(changeY>5){
						scrolling=false;
						moveY= null;
					}
				};
			});
			self._touchEndListener= function(e){
				if(!scrolling || !self.touchEnabled)
					return ;
				self.touchEnabled= false;
				scrolling=false;
				transX = baseX-startX;
				if(transX > 50){
					self.toLeft(null, 300);
				}else if(transX < -50){
					self.toRight(null, 300);
				}else{
					self.toCurrent(100);
					self.touchEnabled= true;
				}
				scrolling=
				startX=
				startY=
				moveX=
				moveY=
				baseX=
				distX=
				newX=
				dir=
				transX=null;
			}
			$doc.on(touchEv.END_EV,self._touchEndListener)
			return this;
		},

		swipeDirection:function(x1, x2, y1, y2){
			var xDelta = Math.abs(x1 - x2), yDelta = Math.abs(y1 - y2)
			return xDelta >= yDelta ? (x1 - x2 > 0 ? 'Left' : 'Right') : (y1 - y2 > 0 ? 'Up' : 'Down');
		},
		//释放内存
		destory:　function(remove){
			this.stopAutoLoop();
			removeEventListener('onorientationchange' in window ?
				'orientationchange' : 'resize', this._resizeListener);
			this.$container[0].removeEventListener('', this, false);
			this.$el.off();
			remove && this.$el.empty();
			
			$doc.off(this.touchEv.START_EV+' '+this.touchEv.END_EV, this._bodyEventListener)
			$doc.off(this.touchEv.END_EV, this._touchEndListener)
			$doc= null;
			this.__proto__ = null;
			for(var i in this){
				delete this[i];
			}
		}

	});

//添加到Zepto
$.fn.touchCarousel=function(options){
	options.$el	= this;
	var instance = new TouchScroll(options);
	return instance ;
} 

})(Zepto);
