import React,{Component} from "react";

import CA from "../components/CA";
import CB from "../components/CB";

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
                path:"/a/b",
                component:CB
            }
        ]
    },
    {
        path:"/b",
        component:CB,
        children:[
            {
                path:"/b/a",
                component:CA
            }
        ]
    }
];

const components = bindComponent(routes);
var views = {};

// 路由链接
class RouterLink extends Component {
    render() {
        var props = this.props;
        return (<a onClick={()=>{
            changeView(props.to);
        }}>
            {props.children}
        </a>);

    }
}
// 路由视口选择
function selectView(path){
    return views[basePath(path)];
}
// 路径分割
function basePath(path){
    var reg = /\/[^/]+$/;
    var basePath = path.replace(reg,(s, i)=>(i?'':"/"));
    return basePath;
}
// 设置视口状态
function setViewState(path){
    var pathArr = path.split(/(?=\/)/);
    var pathsStr = pathArr[0];
    var pathState = {};
    for(var i=0;i<pathArr.length;i++){
        pathState[basePath(pathsStr)] = pathsStr;
        pathsStr += pathArr[i+1];
        var v = selectView(pathsStr);
        if(v)v.setState({path:pathsStr});
    }

    var str, view;
    for(var k in views){
        str = pathState[k];
        view = views[k];
        view.setState({path:str?str:''});
    }


}
// 视图切换
function changeView(path){
    setViewState(path);
    window.history.pushState({path}, '', "#"+path);
}


// 路由出口
class RouterView extends Component {
    constructor(){
        super();
        this.components = {};
        this.hash = '';
        this.state = {
            path:''
        };
    }
    render() {
        return (<div>
            {this.components[this.state.path]}
        </div>);
    }

    componentWillMount(){
        // 视口与路径绑定
        var hash = this.hash = getHash();
        var Component;
        views[hash] = this;

        console.log(this.hash+"挂载");
        for(var  k in components){
            if(basePath(k) === hash){
                Component = components[k];
                this.components[k] = <Component />
            }
        }
    }
    componentWillUnmount(){
        console.log(this.hash+"卸载");
        delete views[this.hash];
    }
}
routerInit();
// 初始化
function routerInit(){
    // 初始化路径hash值
    window.location.hash="#/";
    // 绑定路由改变的事件
    window.onpopstate = e=>{
        var state = e.state;
        setViewState(state?state.path:"/");
    };
}

// 模板与路径进行绑定
function bindComponent(routes){
    var routesObj = {};

    // 递归绑定路由
    (function bindCom(routes){
        for(let obj of routes ){
            routesObj[obj.path] = obj.component;
            if(Array.isArray(obj.children)){
                bindCom(obj.children);
            }
        }
    })(routes);

    return routesObj;
}

// 获取当前Hash值
function getHash(){
    return window.location.hash.replace('#','');
}
export {RouterLink, RouterView};