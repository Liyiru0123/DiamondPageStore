# DiamondPageStore
Database system assignment 2.

使用时先从仓库pull最新版本的文件，修改后提交到（commit）分支branch，执行合并（发起pull request），建议每次修改添加批注

教程参见[GitHub 及 GitHub Desktop 详细使用教程（通俗易懂）-CSDN博客](https://blog.csdn.net/TYRA9/article/details/144791691)

github需要一定时间学习，desktop是图形化操作界面，上手起来较为容易

report可能用得到的文字
pages/ (HTML): 骨架。负责页面结构、语义化标签。它应该尽量“傻”，只负责占位，不负责逻辑。
scripts/ (JS): 大脑。负责交互逻辑、数据获取（Fetch API）、DOM 操作。
styles/ (CSS): 皮肤。负责视觉样式、布局美化。
api/ (PHP): 心脏。负责处理业务逻辑、和数据库交互、输出 JSON 数据给 JS。
config/ (PHP): 神经中枢配置。如数据库连接密码等。