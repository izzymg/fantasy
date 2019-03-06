/******/ (function(modules) { // webpackBootstrap
/******/ 	// The module cache
/******/ 	var installedModules = {};
/******/
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/
/******/ 		// Check if module is in cache
/******/ 		if(installedModules[moduleId]) {
/******/ 			return installedModules[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = installedModules[moduleId] = {
/******/ 			i: moduleId,
/******/ 			l: false,
/******/ 			exports: {}
/******/ 		};
/******/
/******/ 		// Execute the module function
/******/ 		modules[moduleId].call(module.exports, module, module.exports, __webpack_require__);
/******/
/******/ 		// Flag the module as loaded
/******/ 		module.l = true;
/******/
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/
/******/
/******/ 	// expose the modules object (__webpack_modules__)
/******/ 	__webpack_require__.m = modules;
/******/
/******/ 	// expose the module cache
/******/ 	__webpack_require__.c = installedModules;
/******/
/******/ 	// define getter function for harmony exports
/******/ 	__webpack_require__.d = function(exports, name, getter) {
/******/ 		if(!__webpack_require__.o(exports, name)) {
/******/ 			Object.defineProperty(exports, name, { enumerable: true, get: getter });
/******/ 		}
/******/ 	};
/******/
/******/ 	// define __esModule on exports
/******/ 	__webpack_require__.r = function(exports) {
/******/ 		if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 			Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 		}
/******/ 		Object.defineProperty(exports, '__esModule', { value: true });
/******/ 	};
/******/
/******/ 	// create a fake namespace object
/******/ 	// mode & 1: value is a module id, require it
/******/ 	// mode & 2: merge all properties of value into the ns
/******/ 	// mode & 4: return value when already ns object
/******/ 	// mode & 8|1: behave like require
/******/ 	__webpack_require__.t = function(value, mode) {
/******/ 		if(mode & 1) value = __webpack_require__(value);
/******/ 		if(mode & 8) return value;
/******/ 		if((mode & 4) && typeof value === 'object' && value && value.__esModule) return value;
/******/ 		var ns = Object.create(null);
/******/ 		__webpack_require__.r(ns);
/******/ 		Object.defineProperty(ns, 'default', { enumerable: true, value: value });
/******/ 		if(mode & 2 && typeof value != 'string') for(var key in value) __webpack_require__.d(ns, key, function(key) { return value[key]; }.bind(null, key));
/******/ 		return ns;
/******/ 	};
/******/
/******/ 	// getDefaultExport function for compatibility with non-harmony modules
/******/ 	__webpack_require__.n = function(module) {
/******/ 		var getter = module && module.__esModule ?
/******/ 			function getDefault() { return module['default']; } :
/******/ 			function getModuleExports() { return module; };
/******/ 		__webpack_require__.d(getter, 'a', getter);
/******/ 		return getter;
/******/ 	};
/******/
/******/ 	// Object.prototype.hasOwnProperty.call
/******/ 	__webpack_require__.o = function(object, property) { return Object.prototype.hasOwnProperty.call(object, property); };
/******/
/******/ 	// __webpack_public_path__
/******/ 	__webpack_require__.p = "";
/******/
/******/
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(__webpack_require__.s = "./src/ts/postForm.ts");
/******/ })
/************************************************************************/
/******/ ({

/***/ "./src/ts/postForm.ts":
/*!****************************!*\
  !*** ./src/ts/postForm.ts ***!
  \****************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\n/* harmony import */ var _statusbox__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ./statusbox */ \"./src/ts/statusbox.ts\");\nvar __awaiter = (undefined && undefined.__awaiter) || function (thisArg, _arguments, P, generator) {\r\n    return new (P || (P = Promise))(function (resolve, reject) {\r\n        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }\r\n        function rejected(value) { try { step(generator[\"throw\"](value)); } catch (e) { reject(e); } }\r\n        function step(result) { result.done ? resolve(result.value) : new P(function (resolve) { resolve(result.value); }).then(fulfilled, rejected); }\r\n        step((generator = generator.apply(thisArg, _arguments || [])).next());\r\n    });\r\n};\r\n\r\nfunction initialisePostForm(onSuccess, onError) {\r\n    const wrapper = document.querySelector(\".postFormBox\");\r\n    const form = wrapper.querySelector(\"form\");\r\n    function submitPost() {\r\n        return __awaiter(this, void 0, void 0, function* () {\r\n            const data = new FormData(form);\r\n            const res = yield fetch(form.action, {\r\n                method: form.method,\r\n                body: data\r\n            });\r\n            return res;\r\n        });\r\n    }\r\n    form.addEventListener(\"submit\", (event) => __awaiter(this, void 0, void 0, function* () {\r\n        event.preventDefault();\r\n        event.stopPropagation();\r\n        try {\r\n            const res = yield submitPost();\r\n            const text = yield res.text();\r\n            if (!res.ok) {\r\n                return onError(text || `Sorry - unknown error, status ${res.status}`);\r\n            }\r\n            return onSuccess(text);\r\n        }\r\n        catch (error) {\r\n            return onError(\"Network error - server may be down\");\r\n        }\r\n    }));\r\n}\r\nfunction init() {\r\n    try {\r\n        fetch(\"\");\r\n    }\r\n    catch (error) {\r\n        return;\r\n    }\r\n    const sb = new _statusbox__WEBPACK_IMPORTED_MODULE_0__[\"default\"]();\r\n    initialisePostForm((text) => {\r\n        sb.update(text, false);\r\n    }, (text) => {\r\n        sb.update(text, true);\r\n    });\r\n}\r\nif (document.readyState !== \"loading\") {\r\n    init();\r\n}\r\nelse {\r\n    document.addEventListener(\"DOMContentLoaded\", init);\r\n}\r\n/* harmony default export */ __webpack_exports__[\"default\"] = (initialisePostForm);\r\n\n\n//# sourceURL=webpack:///./src/ts/postForm.ts?");

/***/ }),

/***/ "./src/ts/statusbox.ts":
/*!*****************************!*\
  !*** ./src/ts/statusbox.ts ***!
  \*****************************/
/*! exports provided: default */
/***/ (function(module, __webpack_exports__, __webpack_require__) {

"use strict";
eval("__webpack_require__.r(__webpack_exports__);\nclass Statusbox {\r\n    constructor() {\r\n        this.ele = document.querySelector(\".statusbox\");\r\n        this.text = this.ele.querySelector(\".text\");\r\n        this.close = this.ele.querySelector(\".close\");\r\n        this.close.addEventListener(\"click\", () => {\r\n            this.ele.style.opacity = \"0\";\r\n            setTimeout(() => {\r\n                this.ele.style.height = \"0\";\r\n                this.ele.style.visibility = \"hidden\";\r\n            }, 150);\r\n            this.shown = false;\r\n        });\r\n    }\r\n    update(text, error = false) {\r\n        if (error) {\r\n            this.text.classList.add(\"error\");\r\n        }\r\n        else {\r\n            this.text.classList.remove(\"error\");\r\n        }\r\n        this.text.textContent = text;\r\n        if (!this.shown) {\r\n            this.ele.style.visibility = \"visible\";\r\n            this.ele.style.height = \"unset\";\r\n            this.ele.style.opacity = \"1\";\r\n            this.shown = true;\r\n        }\r\n    }\r\n}\r\n/* harmony default export */ __webpack_exports__[\"default\"] = (Statusbox);\r\n\n\n//# sourceURL=webpack:///./src/ts/statusbox.ts?");

/***/ })

/******/ });