import React,{Component} from "react";

import CA from "../components/CA";
import CB from "../components/CB";
import CC from "../components/CC";
import CD from "../components/CD";

/*
* 1. 路由处理模板生成
* 2. 路由判断
*
*
* */

const routes = [
    {
        path:"/a",
        component:CA,
        children:[
            {
                path:"/a/c",
                component:CC,
                children:[
                    {
                        path:"/a/c/b",
                        component:CB
                    }
                ]
            },
            {
                path:"/a/d",
                component:CD
            }
        ]
    },
    {
        path:"/b",
        component:CB
    }
];



/*
*
* 路由与模板 1对1
*   {
*       /a:{
*           component:CA
*           children:{
*               /a/b:{
*                   component:CB
*               }
*           }
*       }
*
*   }
* 路由与视口 n对1
* 模板与视口 n对1
*
*
*
* */

class Router {
    constructor(routes, options){
        this.routes = routes;
        this.options = options;
        this.init();
    }

    // 初始化
    init(){
        // 绑定路径与模板对象
        this.pbc = this.pathBindComponent();
        this.location = window.location;
        // 初始hash值
        this.location.hash = "/";

    }
    // 工具类方法 ---------------------------------------
    // 路由地址切割
    splitPath(path){
        var paths = {}, len;
        paths.items = path.split(/(?=\/)/);
        len = paths.items.length;

        paths.lastPath = paths.items[len-1];
        paths.basePath = paths.items.slice(0,len-1).join('');
        return paths;
    }

    getHash(href){
        var hash = href?
            this.getHref(href).hash
            :this.location.hash;

        return hash.replace(/^#(?=\/)/,"");
    }
    getHref(href){
        var hrefArr, hrefObj;

        href = href || this.location.href;
        hrefArr = Router.HREF_REGEXP.exec(href);

        if(hrefArr === null)
            throw new Error("The path error: "+ href);

        hrefObj = {
            input:hrefArr[0],
            port:hrefArr[1],
            host:hrefArr[2],
            path:hrefArr[3],
            query:hrefArr[4],
            hash:hrefArr[5]
        };
        return hrefObj;
    }

    // 路径与模板 ----------------------------------------------------
    // 路径与模板进行绑定
    pathBindComponent(routes){
        // 递归绑定
        var pbc = (function rbcFn(routes, context){
            if(!Array.isArray(routes))
                throw new Error("The routes should be an array. And now it's " + typeof routes);
            var o = {}, ro;
            for(var route of routes){
                ro = o[context.splitPath(route.path).lastPath] = {};
                ro.component = route.component;
                if(route.children){
                    ro.children =  rbcFn(route.children, context);
                }
            }
            return o;
        })(routes || this.routes, this);
        return pbc;
    }
    // 通过路径获取route对象
    getRoute(path, cb){
        try{
            var paths = this.splitPath(path).items;
            var pbc =  this.pbc[paths[0]], children;
            cb && cb(pbc,this.pbc);
            for(var i=1,len=paths.length;i<len;i++){
                children = pbc.children;
                pbc = children[paths[i]];
                cb && cb(pbc, children);
            }
            return pbc;
        }catch(e){
            throw new Error("not find route. Please check if the path is correct.");
        }
    }
    // 通过路径获取模板
    getComponent(path){
        try{
            return this.getRoute(path).component;
        }catch(e){
            throw new Error("not find component. Please check if the path is correct.");
        }
    }

    // 路径与视口 ----------------------------------------------------
    pathBindView(path, view){
        // var viewOf = this.getViewOf(path);
        // var children;
        // 判断当前路由对象是否已经绑定视口. 如果绑定则为当前路径的子路由对象绑定
        this.getRoute(path, (pbc, viewOf)=>{
            if(!("view" in viewOf)){
                // 设置视口属性为不可遍历的
                console.log(viewOf);
                Object.defineProperty(viewOf, "view", {
                    value: view,
                    enumerable: false,
                    configurable:true
                });
            }
        });
    }
    // 通过路径获取视口
    getView(path){
        return this.getViewOf(path).view;
    }
    // 移除视口与路径的绑定
    removeView(path){
        var children = this.getRoute(path).children;
        if(children)
            delete children.view;
    }
    // 获取视口所在对象
    getViewOf(path){
        var basePath = this.splitPath(path).basePath;
        if(basePath === ""){// 根对象
            return this.pbc;
        }
        // 子对象
        return this.getRoute(basePath).children;
    }

    // 切换控制 ---------------------------------
    // 根据路由地址切换视口
    switchView(path){
        var view = this.getView(path);
        var Compnent = this.getComponent(path);
        if(view){
            view.setState({nowComponent:<Compnent />});
        }
    }
    // 根据路由地址切换视口以及子视口
    changeView(path){
        var paths = this.splitPath(path).items;
        for(let i=0, joinPath='';i<paths.length;i++){
            joinPath += paths[i];
            // 异步造成无法同步更新 待改进--------------------------------------------
            setTimeout(()=>{
                console.log(joinPath);
                this.switchView(joinPath)
            },i*1000);
        }
    }

}

Router.HREF_REGEXP = /\w+:\/\/((?:\w|[.-])*?)(:\d+)?((?:\/.*?)*?)?(\?.+?=.+?&?)?(#.*?)?$/;

const route = new Router(routes);

// 路由链接
class RouterLink extends Component {
    render() {
        var props = this.props;
        return (<a onClick={()=>{
            window.history.pushState({path:props.to},'',"#"+props.to);
            route.changeView(props.to);
        }}>
            {props.children}
        </a>);

    }
}


// 路由出口
class RouterView extends Component {
    constructor(){
        super();
        this.hash = "";// 当前视口所属路径
        this.state = {
            nowComponent:null
        };
    }
    render() {
        return (<div>
            {this.state.nowComponent}
        </div>);
    }
    componentDidMount(){
        (()=>{
            var hash = this.hash = route.getHash();
            // 路径与视口绑定
            route.pathBindView(hash, this);
        })();
    }
    componentWillUnmount(){
        route.removeView(this.hash);
    }
}
export {RouterLink, RouterView};