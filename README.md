# grid-puzzle
x宫格拼图

此项目主要目的是用来探索搜索算法
1）广度优先A*搜索
2）迭代加深A*搜索
结论：广度优先A*搜索速度比较快，缺点是所有探索过的节点必须都存放在内存中
而迭代加深A*搜索搜索速度比较慢，且会有重复搜索节点问题，但是只需要保留当前搜索路径在内存中就可以了

对于九宫格可以直接使用算法1直接得出最优结果，然而十六宫格无法直接得出，性能太差，采取的策略是每次只要前N个Piece到位，不断提升N的值，直到等于16，则搜索完成

项目中几个有趣的问题
1）本项目用PIXI.js来渲染图形，PIXI.js是目前为止历史比较悠久且性能较高的2D精灵渲染库，API比较多，然而即使是这样它做的事情是比较纯粹的，如果需要其它比如补间动画(tween.js)，物理模拟(matter.js)，声音系统(pixi-sound)，需要自己寻找额外的第三方库来补充
2）对于手机拍摄的照片会有图片旋转问题，通过读取图片的EXIF信息可以获得旋转角度，然后使用一个精灵去加载原始图片，然后旋转精灵，调整旋转后坐标，最终通过RenderTexture输出最终结果。
