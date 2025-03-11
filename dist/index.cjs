'use strict';

var React$1 = require('react');
var client = require('react-dom/client');

function max$1(values, valueof) {
  let max;
  if (valueof === undefined) {
    for (const value of values) {
      if (value != null
          && (max < value || (max === undefined && value >= value))) {
        max = value;
      }
    }
  } else {
    let index = -1;
    for (let value of values) {
      if ((value = valueof(value, ++index, values)) != null
          && (max < value || (max === undefined && value >= value))) {
        max = value;
      }
    }
  }
  return max;
}

var noop = {value: () => {}};

function dispatch() {
  for (var i = 0, n = arguments.length, _ = {}, t; i < n; ++i) {
    if (!(t = arguments[i] + "") || (t in _) || /[\s.]/.test(t)) throw new Error("illegal type: " + t);
    _[t] = [];
  }
  return new Dispatch(_);
}

function Dispatch(_) {
  this._ = _;
}

function parseTypenames$1(typenames, types) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    if (t && !types.hasOwnProperty(t)) throw new Error("unknown type: " + t);
    return {type: t, name: name};
  });
}

Dispatch.prototype = dispatch.prototype = {
  constructor: Dispatch,
  on: function(typename, callback) {
    var _ = this._,
        T = parseTypenames$1(typename + "", _),
        t,
        i = -1,
        n = T.length;

    // If no callback was specified, return the callback of the given type and name.
    if (arguments.length < 2) {
      while (++i < n) if ((t = (typename = T[i]).type) && (t = get$1(_[t], typename.name))) return t;
      return;
    }

    // If a type was specified, set the callback for the given type and name.
    // Otherwise, if a null callback was specified, remove callbacks of the given name.
    if (callback != null && typeof callback !== "function") throw new Error("invalid callback: " + callback);
    while (++i < n) {
      if (t = (typename = T[i]).type) _[t] = set$1(_[t], typename.name, callback);
      else if (callback == null) for (t in _) _[t] = set$1(_[t], typename.name, null);
    }

    return this;
  },
  copy: function() {
    var copy = {}, _ = this._;
    for (var t in _) copy[t] = _[t].slice();
    return new Dispatch(copy);
  },
  call: function(type, that) {
    if ((n = arguments.length - 2) > 0) for (var args = new Array(n), i = 0, n, t; i < n; ++i) args[i] = arguments[i + 2];
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  },
  apply: function(type, that, args) {
    if (!this._.hasOwnProperty(type)) throw new Error("unknown type: " + type);
    for (var t = this._[type], i = 0, n = t.length; i < n; ++i) t[i].value.apply(that, args);
  }
};

function get$1(type, name) {
  for (var i = 0, n = type.length, c; i < n; ++i) {
    if ((c = type[i]).name === name) {
      return c.value;
    }
  }
}

function set$1(type, name, callback) {
  for (var i = 0, n = type.length; i < n; ++i) {
    if (type[i].name === name) {
      type[i] = noop, type = type.slice(0, i).concat(type.slice(i + 1));
      break;
    }
  }
  if (callback != null) type.push({name: name, value: callback});
  return type;
}

var xhtml = "http://www.w3.org/1999/xhtml";

var namespaces = {
  svg: "http://www.w3.org/2000/svg",
  xhtml: xhtml,
  xlink: "http://www.w3.org/1999/xlink",
  xml: "http://www.w3.org/XML/1998/namespace",
  xmlns: "http://www.w3.org/2000/xmlns/"
};

function namespace(name) {
  var prefix = name += "", i = prefix.indexOf(":");
  if (i >= 0 && (prefix = name.slice(0, i)) !== "xmlns") name = name.slice(i + 1);
  return namespaces.hasOwnProperty(prefix) ? {space: namespaces[prefix], local: name} : name; // eslint-disable-line no-prototype-builtins
}

function creatorInherit(name) {
  return function() {
    var document = this.ownerDocument,
        uri = this.namespaceURI;
    return uri === xhtml && document.documentElement.namespaceURI === xhtml
        ? document.createElement(name)
        : document.createElementNS(uri, name);
  };
}

function creatorFixed(fullname) {
  return function() {
    return this.ownerDocument.createElementNS(fullname.space, fullname.local);
  };
}

function creator(name) {
  var fullname = namespace(name);
  return (fullname.local
      ? creatorFixed
      : creatorInherit)(fullname);
}

function none() {}

function selector(selector) {
  return selector == null ? none : function() {
    return this.querySelector(selector);
  };
}

function selection_select(select) {
  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
      }
    }
  }

  return new Selection$1(subgroups, this._parents);
}

// Given something array like (or null), returns something that is strictly an
// array. This is used to ensure that array-like objects passed to d3.selectAll
// or selection.selectAll are converted into proper arrays when creating a
// selection; we don’t ever want to create a selection backed by a live
// HTMLCollection or NodeList. However, note that selection.selectAll will use a
// static NodeList as a group, since it safely derived from querySelectorAll.
function array(x) {
  return x == null ? [] : Array.isArray(x) ? x : Array.from(x);
}

function empty() {
  return [];
}

function selectorAll(selector) {
  return selector == null ? empty : function() {
    return this.querySelectorAll(selector);
  };
}

function arrayAll(select) {
  return function() {
    return array(select.apply(this, arguments));
  };
}

function selection_selectAll(select) {
  if (typeof select === "function") select = arrayAll(select);
  else select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        subgroups.push(select.call(node, node.__data__, i, group));
        parents.push(node);
      }
    }
  }

  return new Selection$1(subgroups, parents);
}

function matcher(selector) {
  return function() {
    return this.matches(selector);
  };
}

function childMatcher(selector) {
  return function(node) {
    return node.matches(selector);
  };
}

var find = Array.prototype.find;

function childFind(match) {
  return function() {
    return find.call(this.children, match);
  };
}

function childFirst() {
  return this.firstElementChild;
}

function selection_selectChild(match) {
  return this.select(match == null ? childFirst
      : childFind(typeof match === "function" ? match : childMatcher(match)));
}

var filter = Array.prototype.filter;

function children() {
  return Array.from(this.children);
}

function childrenFilter(match) {
  return function() {
    return filter.call(this.children, match);
  };
}

function selection_selectChildren(match) {
  return this.selectAll(match == null ? children
      : childrenFilter(typeof match === "function" ? match : childMatcher(match)));
}

function selection_filter(match) {
  if (typeof match !== "function") match = matcher(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Selection$1(subgroups, this._parents);
}

function sparse(update) {
  return new Array(update.length);
}

function selection_enter() {
  return new Selection$1(this._enter || this._groups.map(sparse), this._parents);
}

function EnterNode(parent, datum) {
  this.ownerDocument = parent.ownerDocument;
  this.namespaceURI = parent.namespaceURI;
  this._next = null;
  this._parent = parent;
  this.__data__ = datum;
}

EnterNode.prototype = {
  constructor: EnterNode,
  appendChild: function(child) { return this._parent.insertBefore(child, this._next); },
  insertBefore: function(child, next) { return this._parent.insertBefore(child, next); },
  querySelector: function(selector) { return this._parent.querySelector(selector); },
  querySelectorAll: function(selector) { return this._parent.querySelectorAll(selector); }
};

function constant$3(x) {
  return function() {
    return x;
  };
}

function bindIndex(parent, group, enter, update, exit, data) {
  var i = 0,
      node,
      groupLength = group.length,
      dataLength = data.length;

  // Put any non-null nodes that fit into update.
  // Put any null nodes into enter.
  // Put any remaining data into enter.
  for (; i < dataLength; ++i) {
    if (node = group[i]) {
      node.__data__ = data[i];
      update[i] = node;
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Put any non-null nodes that don’t fit into exit.
  for (; i < groupLength; ++i) {
    if (node = group[i]) {
      exit[i] = node;
    }
  }
}

function bindKey(parent, group, enter, update, exit, data, key) {
  var i,
      node,
      nodeByKeyValue = new Map,
      groupLength = group.length,
      dataLength = data.length,
      keyValues = new Array(groupLength),
      keyValue;

  // Compute the key for each node.
  // If multiple nodes have the same key, the duplicates are added to exit.
  for (i = 0; i < groupLength; ++i) {
    if (node = group[i]) {
      keyValues[i] = keyValue = key.call(node, node.__data__, i, group) + "";
      if (nodeByKeyValue.has(keyValue)) {
        exit[i] = node;
      } else {
        nodeByKeyValue.set(keyValue, node);
      }
    }
  }

  // Compute the key for each datum.
  // If there a node associated with this key, join and add it to update.
  // If there is not (or the key is a duplicate), add it to enter.
  for (i = 0; i < dataLength; ++i) {
    keyValue = key.call(parent, data[i], i, data) + "";
    if (node = nodeByKeyValue.get(keyValue)) {
      update[i] = node;
      node.__data__ = data[i];
      nodeByKeyValue.delete(keyValue);
    } else {
      enter[i] = new EnterNode(parent, data[i]);
    }
  }

  // Add any remaining nodes that were not bound to data to exit.
  for (i = 0; i < groupLength; ++i) {
    if ((node = group[i]) && (nodeByKeyValue.get(keyValues[i]) === node)) {
      exit[i] = node;
    }
  }
}

function datum(node) {
  return node.__data__;
}

function selection_data(value, key) {
  if (!arguments.length) return Array.from(this, datum);

  var bind = key ? bindKey : bindIndex,
      parents = this._parents,
      groups = this._groups;

  if (typeof value !== "function") value = constant$3(value);

  for (var m = groups.length, update = new Array(m), enter = new Array(m), exit = new Array(m), j = 0; j < m; ++j) {
    var parent = parents[j],
        group = groups[j],
        groupLength = group.length,
        data = arraylike(value.call(parent, parent && parent.__data__, j, parents)),
        dataLength = data.length,
        enterGroup = enter[j] = new Array(dataLength),
        updateGroup = update[j] = new Array(dataLength),
        exitGroup = exit[j] = new Array(groupLength);

    bind(parent, group, enterGroup, updateGroup, exitGroup, data, key);

    // Now connect the enter nodes to their following update node, such that
    // appendChild can insert the materialized enter node before this node,
    // rather than at the end of the parent node.
    for (var i0 = 0, i1 = 0, previous, next; i0 < dataLength; ++i0) {
      if (previous = enterGroup[i0]) {
        if (i0 >= i1) i1 = i0 + 1;
        while (!(next = updateGroup[i1]) && ++i1 < dataLength);
        previous._next = next || null;
      }
    }
  }

  update = new Selection$1(update, parents);
  update._enter = enter;
  update._exit = exit;
  return update;
}

// Given some data, this returns an array-like view of it: an object that
// exposes a length property and allows numeric indexing. Note that unlike
// selectAll, this isn’t worried about “live” collections because the resulting
// array will only be used briefly while data is being bound. (It is possible to
// cause the data to change while iterating by using a key function, but please
// don’t; we’d rather avoid a gratuitous copy.)
function arraylike(data) {
  return typeof data === "object" && "length" in data
    ? data // Array, TypedArray, NodeList, array-like
    : Array.from(data); // Map, Set, iterable, string, or anything else
}

function selection_exit() {
  return new Selection$1(this._exit || this._groups.map(sparse), this._parents);
}

function selection_join(onenter, onupdate, onexit) {
  var enter = this.enter(), update = this, exit = this.exit();
  if (typeof onenter === "function") {
    enter = onenter(enter);
    if (enter) enter = enter.selection();
  } else {
    enter = enter.append(onenter + "");
  }
  if (onupdate != null) {
    update = onupdate(update);
    if (update) update = update.selection();
  }
  if (onexit == null) exit.remove(); else onexit(exit);
  return enter && update ? enter.merge(update).order() : update;
}

function selection_merge(context) {
  var selection = context.selection ? context.selection() : context;

  for (var groups0 = this._groups, groups1 = selection._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Selection$1(merges, this._parents);
}

function selection_order() {

  for (var groups = this._groups, j = -1, m = groups.length; ++j < m;) {
    for (var group = groups[j], i = group.length - 1, next = group[i], node; --i >= 0;) {
      if (node = group[i]) {
        if (next && node.compareDocumentPosition(next) ^ 4) next.parentNode.insertBefore(node, next);
        next = node;
      }
    }
  }

  return this;
}

function selection_sort(compare) {
  if (!compare) compare = ascending;

  function compareNode(a, b) {
    return a && b ? compare(a.__data__, b.__data__) : !a - !b;
  }

  for (var groups = this._groups, m = groups.length, sortgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, sortgroup = sortgroups[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        sortgroup[i] = node;
      }
    }
    sortgroup.sort(compareNode);
  }

  return new Selection$1(sortgroups, this._parents).order();
}

function ascending(a, b) {
  return a < b ? -1 : a > b ? 1 : a >= b ? 0 : NaN;
}

function selection_call() {
  var callback = arguments[0];
  arguments[0] = this;
  callback.apply(null, arguments);
  return this;
}

function selection_nodes() {
  return Array.from(this);
}

function selection_node() {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length; i < n; ++i) {
      var node = group[i];
      if (node) return node;
    }
  }

  return null;
}

function selection_size() {
  let size = 0;
  for (const node of this) ++size; // eslint-disable-line no-unused-vars
  return size;
}

function selection_empty() {
  return !this.node();
}

function selection_each(callback) {

  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) callback.call(node, node.__data__, i, group);
    }
  }

  return this;
}

function attrRemove$1(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS$1(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant$1(name, value) {
  return function() {
    this.setAttribute(name, value);
  };
}

function attrConstantNS$1(fullname, value) {
  return function() {
    this.setAttributeNS(fullname.space, fullname.local, value);
  };
}

function attrFunction$1(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttribute(name);
    else this.setAttribute(name, v);
  };
}

function attrFunctionNS$1(fullname, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.removeAttributeNS(fullname.space, fullname.local);
    else this.setAttributeNS(fullname.space, fullname.local, v);
  };
}

function selection_attr(name, value) {
  var fullname = namespace(name);

  if (arguments.length < 2) {
    var node = this.node();
    return fullname.local
        ? node.getAttributeNS(fullname.space, fullname.local)
        : node.getAttribute(fullname);
  }

  return this.each((value == null
      ? (fullname.local ? attrRemoveNS$1 : attrRemove$1) : (typeof value === "function"
      ? (fullname.local ? attrFunctionNS$1 : attrFunction$1)
      : (fullname.local ? attrConstantNS$1 : attrConstant$1)))(fullname, value));
}

function defaultView(node) {
  return (node.ownerDocument && node.ownerDocument.defaultView) // node is a Node
      || (node.document && node) // node is a Window
      || node.defaultView; // node is a Document
}

function styleRemove$1(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant$1(name, value, priority) {
  return function() {
    this.style.setProperty(name, value, priority);
  };
}

function styleFunction$1(name, value, priority) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) this.style.removeProperty(name);
    else this.style.setProperty(name, v, priority);
  };
}

function selection_style(name, value, priority) {
  return arguments.length > 1
      ? this.each((value == null
            ? styleRemove$1 : typeof value === "function"
            ? styleFunction$1
            : styleConstant$1)(name, value, priority == null ? "" : priority))
      : styleValue(this.node(), name);
}

function styleValue(node, name) {
  return node.style.getPropertyValue(name)
      || defaultView(node).getComputedStyle(node, null).getPropertyValue(name);
}

function propertyRemove(name) {
  return function() {
    delete this[name];
  };
}

function propertyConstant(name, value) {
  return function() {
    this[name] = value;
  };
}

function propertyFunction(name, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (v == null) delete this[name];
    else this[name] = v;
  };
}

function selection_property(name, value) {
  return arguments.length > 1
      ? this.each((value == null
          ? propertyRemove : typeof value === "function"
          ? propertyFunction
          : propertyConstant)(name, value))
      : this.node()[name];
}

function classArray(string) {
  return string.trim().split(/^|\s+/);
}

function classList(node) {
  return node.classList || new ClassList(node);
}

function ClassList(node) {
  this._node = node;
  this._names = classArray(node.getAttribute("class") || "");
}

ClassList.prototype = {
  add: function(name) {
    var i = this._names.indexOf(name);
    if (i < 0) {
      this._names.push(name);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  remove: function(name) {
    var i = this._names.indexOf(name);
    if (i >= 0) {
      this._names.splice(i, 1);
      this._node.setAttribute("class", this._names.join(" "));
    }
  },
  contains: function(name) {
    return this._names.indexOf(name) >= 0;
  }
};

function classedAdd(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.add(names[i]);
}

function classedRemove(node, names) {
  var list = classList(node), i = -1, n = names.length;
  while (++i < n) list.remove(names[i]);
}

function classedTrue(names) {
  return function() {
    classedAdd(this, names);
  };
}

function classedFalse(names) {
  return function() {
    classedRemove(this, names);
  };
}

function classedFunction(names, value) {
  return function() {
    (value.apply(this, arguments) ? classedAdd : classedRemove)(this, names);
  };
}

function selection_classed(name, value) {
  var names = classArray(name + "");

  if (arguments.length < 2) {
    var list = classList(this.node()), i = -1, n = names.length;
    while (++i < n) if (!list.contains(names[i])) return false;
    return true;
  }

  return this.each((typeof value === "function"
      ? classedFunction : value
      ? classedTrue
      : classedFalse)(names, value));
}

function textRemove() {
  this.textContent = "";
}

function textConstant$1(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction$1(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.textContent = v == null ? "" : v;
  };
}

function selection_text(value) {
  return arguments.length
      ? this.each(value == null
          ? textRemove : (typeof value === "function"
          ? textFunction$1
          : textConstant$1)(value))
      : this.node().textContent;
}

function htmlRemove() {
  this.innerHTML = "";
}

function htmlConstant(value) {
  return function() {
    this.innerHTML = value;
  };
}

function htmlFunction(value) {
  return function() {
    var v = value.apply(this, arguments);
    this.innerHTML = v == null ? "" : v;
  };
}

function selection_html(value) {
  return arguments.length
      ? this.each(value == null
          ? htmlRemove : (typeof value === "function"
          ? htmlFunction
          : htmlConstant)(value))
      : this.node().innerHTML;
}

function raise() {
  if (this.nextSibling) this.parentNode.appendChild(this);
}

function selection_raise() {
  return this.each(raise);
}

function lower() {
  if (this.previousSibling) this.parentNode.insertBefore(this, this.parentNode.firstChild);
}

function selection_lower() {
  return this.each(lower);
}

function selection_append(name) {
  var create = typeof name === "function" ? name : creator(name);
  return this.select(function() {
    return this.appendChild(create.apply(this, arguments));
  });
}

function constantNull() {
  return null;
}

function selection_insert(name, before) {
  var create = typeof name === "function" ? name : creator(name),
      select = before == null ? constantNull : typeof before === "function" ? before : selector(before);
  return this.select(function() {
    return this.insertBefore(create.apply(this, arguments), select.apply(this, arguments) || null);
  });
}

function remove() {
  var parent = this.parentNode;
  if (parent) parent.removeChild(this);
}

function selection_remove() {
  return this.each(remove);
}

function selection_cloneShallow() {
  var clone = this.cloneNode(false), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_cloneDeep() {
  var clone = this.cloneNode(true), parent = this.parentNode;
  return parent ? parent.insertBefore(clone, this.nextSibling) : clone;
}

function selection_clone(deep) {
  return this.select(deep ? selection_cloneDeep : selection_cloneShallow);
}

function selection_datum(value) {
  return arguments.length
      ? this.property("__data__", value)
      : this.node().__data__;
}

function contextListener(listener) {
  return function(event) {
    listener.call(this, event, this.__data__);
  };
}

function parseTypenames(typenames) {
  return typenames.trim().split(/^|\s+/).map(function(t) {
    var name = "", i = t.indexOf(".");
    if (i >= 0) name = t.slice(i + 1), t = t.slice(0, i);
    return {type: t, name: name};
  });
}

function onRemove(typename) {
  return function() {
    var on = this.__on;
    if (!on) return;
    for (var j = 0, i = -1, m = on.length, o; j < m; ++j) {
      if (o = on[j], (!typename.type || o.type === typename.type) && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
      } else {
        on[++i] = o;
      }
    }
    if (++i) on.length = i;
    else delete this.__on;
  };
}

function onAdd(typename, value, options) {
  return function() {
    var on = this.__on, o, listener = contextListener(value);
    if (on) for (var j = 0, m = on.length; j < m; ++j) {
      if ((o = on[j]).type === typename.type && o.name === typename.name) {
        this.removeEventListener(o.type, o.listener, o.options);
        this.addEventListener(o.type, o.listener = listener, o.options = options);
        o.value = value;
        return;
      }
    }
    this.addEventListener(typename.type, listener, options);
    o = {type: typename.type, name: typename.name, value: value, listener: listener, options: options};
    if (!on) this.__on = [o];
    else on.push(o);
  };
}

function selection_on(typename, value, options) {
  var typenames = parseTypenames(typename + ""), i, n = typenames.length, t;

  if (arguments.length < 2) {
    var on = this.node().__on;
    if (on) for (var j = 0, m = on.length, o; j < m; ++j) {
      for (i = 0, o = on[j]; i < n; ++i) {
        if ((t = typenames[i]).type === o.type && t.name === o.name) {
          return o.value;
        }
      }
    }
    return;
  }

  on = value ? onAdd : onRemove;
  for (i = 0; i < n; ++i) this.each(on(typenames[i], value, options));
  return this;
}

function dispatchEvent(node, type, params) {
  var window = defaultView(node),
      event = window.CustomEvent;

  if (typeof event === "function") {
    event = new event(type, params);
  } else {
    event = window.document.createEvent("Event");
    if (params) event.initEvent(type, params.bubbles, params.cancelable), event.detail = params.detail;
    else event.initEvent(type, false, false);
  }

  node.dispatchEvent(event);
}

function dispatchConstant(type, params) {
  return function() {
    return dispatchEvent(this, type, params);
  };
}

function dispatchFunction(type, params) {
  return function() {
    return dispatchEvent(this, type, params.apply(this, arguments));
  };
}

function selection_dispatch(type, params) {
  return this.each((typeof params === "function"
      ? dispatchFunction
      : dispatchConstant)(type, params));
}

function* selection_iterator() {
  for (var groups = this._groups, j = 0, m = groups.length; j < m; ++j) {
    for (var group = groups[j], i = 0, n = group.length, node; i < n; ++i) {
      if (node = group[i]) yield node;
    }
  }
}

var root = [null];

function Selection$1(groups, parents) {
  this._groups = groups;
  this._parents = parents;
}

function selection() {
  return new Selection$1([[document.documentElement]], root);
}

function selection_selection() {
  return this;
}

Selection$1.prototype = selection.prototype = {
  constructor: Selection$1,
  select: selection_select,
  selectAll: selection_selectAll,
  selectChild: selection_selectChild,
  selectChildren: selection_selectChildren,
  filter: selection_filter,
  data: selection_data,
  enter: selection_enter,
  exit: selection_exit,
  join: selection_join,
  merge: selection_merge,
  selection: selection_selection,
  order: selection_order,
  sort: selection_sort,
  call: selection_call,
  nodes: selection_nodes,
  node: selection_node,
  size: selection_size,
  empty: selection_empty,
  each: selection_each,
  attr: selection_attr,
  style: selection_style,
  property: selection_property,
  classed: selection_classed,
  text: selection_text,
  html: selection_html,
  raise: selection_raise,
  lower: selection_lower,
  append: selection_append,
  insert: selection_insert,
  remove: selection_remove,
  clone: selection_clone,
  datum: selection_datum,
  on: selection_on,
  dispatch: selection_dispatch,
  [Symbol.iterator]: selection_iterator
};

function select(selector) {
  return typeof selector === "string"
      ? new Selection$1([[document.querySelector(selector)]], [document.documentElement])
      : new Selection$1([[selector]], root);
}

function sourceEvent(event) {
  let sourceEvent;
  while (sourceEvent = event.sourceEvent) event = sourceEvent;
  return event;
}

function pointer(event, node) {
  event = sourceEvent(event);
  if (node === undefined) node = event.currentTarget;
  if (node) {
    var svg = node.ownerSVGElement || node;
    if (svg.createSVGPoint) {
      var point = svg.createSVGPoint();
      point.x = event.clientX, point.y = event.clientY;
      point = point.matrixTransform(node.getScreenCTM().inverse());
      return [point.x, point.y];
    }
    if (node.getBoundingClientRect) {
      var rect = node.getBoundingClientRect();
      return [event.clientX - rect.left - node.clientLeft, event.clientY - rect.top - node.clientTop];
    }
  }
  return [event.pageX, event.pageY];
}

function selectAll(selector) {
  return typeof selector === "string"
      ? new Selection$1([document.querySelectorAll(selector)], [document.documentElement])
      : new Selection$1([array(selector)], root);
}

// These are typically used in conjunction with noevent to ensure that we can
// preventDefault on the event.
const nonpassivecapture = {capture: true, passive: false};

function noevent$1(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}

function dragDisable(view) {
  var root = view.document.documentElement,
      selection = select(view).on("dragstart.drag", noevent$1, nonpassivecapture);
  if ("onselectstart" in root) {
    selection.on("selectstart.drag", noevent$1, nonpassivecapture);
  } else {
    root.__noselect = root.style.MozUserSelect;
    root.style.MozUserSelect = "none";
  }
}

function yesdrag(view, noclick) {
  var root = view.document.documentElement,
      selection = select(view).on("dragstart.drag", null);
  if (noclick) {
    selection.on("click.drag", noevent$1, nonpassivecapture);
    setTimeout(function() { selection.on("click.drag", null); }, 0);
  }
  if ("onselectstart" in root) {
    selection.on("selectstart.drag", null);
  } else {
    root.style.MozUserSelect = root.__noselect;
    delete root.__noselect;
  }
}

function define(constructor, factory, prototype) {
  constructor.prototype = factory.prototype = prototype;
  prototype.constructor = constructor;
}

function extend(parent, definition) {
  var prototype = Object.create(parent.prototype);
  for (var key in definition) prototype[key] = definition[key];
  return prototype;
}

function Color() {}

var darker = 0.7;
var brighter = 1 / darker;

var reI = "\\s*([+-]?\\d+)\\s*",
    reN = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)\\s*",
    reP = "\\s*([+-]?(?:\\d*\\.)?\\d+(?:[eE][+-]?\\d+)?)%\\s*",
    reHex = /^#([0-9a-f]{3,8})$/,
    reRgbInteger = new RegExp(`^rgb\\(${reI},${reI},${reI}\\)$`),
    reRgbPercent = new RegExp(`^rgb\\(${reP},${reP},${reP}\\)$`),
    reRgbaInteger = new RegExp(`^rgba\\(${reI},${reI},${reI},${reN}\\)$`),
    reRgbaPercent = new RegExp(`^rgba\\(${reP},${reP},${reP},${reN}\\)$`),
    reHslPercent = new RegExp(`^hsl\\(${reN},${reP},${reP}\\)$`),
    reHslaPercent = new RegExp(`^hsla\\(${reN},${reP},${reP},${reN}\\)$`);

var named = {
  aliceblue: 0xf0f8ff,
  antiquewhite: 0xfaebd7,
  aqua: 0x00ffff,
  aquamarine: 0x7fffd4,
  azure: 0xf0ffff,
  beige: 0xf5f5dc,
  bisque: 0xffe4c4,
  black: 0x000000,
  blanchedalmond: 0xffebcd,
  blue: 0x0000ff,
  blueviolet: 0x8a2be2,
  brown: 0xa52a2a,
  burlywood: 0xdeb887,
  cadetblue: 0x5f9ea0,
  chartreuse: 0x7fff00,
  chocolate: 0xd2691e,
  coral: 0xff7f50,
  cornflowerblue: 0x6495ed,
  cornsilk: 0xfff8dc,
  crimson: 0xdc143c,
  cyan: 0x00ffff,
  darkblue: 0x00008b,
  darkcyan: 0x008b8b,
  darkgoldenrod: 0xb8860b,
  darkgray: 0xa9a9a9,
  darkgreen: 0x006400,
  darkgrey: 0xa9a9a9,
  darkkhaki: 0xbdb76b,
  darkmagenta: 0x8b008b,
  darkolivegreen: 0x556b2f,
  darkorange: 0xff8c00,
  darkorchid: 0x9932cc,
  darkred: 0x8b0000,
  darksalmon: 0xe9967a,
  darkseagreen: 0x8fbc8f,
  darkslateblue: 0x483d8b,
  darkslategray: 0x2f4f4f,
  darkslategrey: 0x2f4f4f,
  darkturquoise: 0x00ced1,
  darkviolet: 0x9400d3,
  deeppink: 0xff1493,
  deepskyblue: 0x00bfff,
  dimgray: 0x696969,
  dimgrey: 0x696969,
  dodgerblue: 0x1e90ff,
  firebrick: 0xb22222,
  floralwhite: 0xfffaf0,
  forestgreen: 0x228b22,
  fuchsia: 0xff00ff,
  gainsboro: 0xdcdcdc,
  ghostwhite: 0xf8f8ff,
  gold: 0xffd700,
  goldenrod: 0xdaa520,
  gray: 0x808080,
  green: 0x008000,
  greenyellow: 0xadff2f,
  grey: 0x808080,
  honeydew: 0xf0fff0,
  hotpink: 0xff69b4,
  indianred: 0xcd5c5c,
  indigo: 0x4b0082,
  ivory: 0xfffff0,
  khaki: 0xf0e68c,
  lavender: 0xe6e6fa,
  lavenderblush: 0xfff0f5,
  lawngreen: 0x7cfc00,
  lemonchiffon: 0xfffacd,
  lightblue: 0xadd8e6,
  lightcoral: 0xf08080,
  lightcyan: 0xe0ffff,
  lightgoldenrodyellow: 0xfafad2,
  lightgray: 0xd3d3d3,
  lightgreen: 0x90ee90,
  lightgrey: 0xd3d3d3,
  lightpink: 0xffb6c1,
  lightsalmon: 0xffa07a,
  lightseagreen: 0x20b2aa,
  lightskyblue: 0x87cefa,
  lightslategray: 0x778899,
  lightslategrey: 0x778899,
  lightsteelblue: 0xb0c4de,
  lightyellow: 0xffffe0,
  lime: 0x00ff00,
  limegreen: 0x32cd32,
  linen: 0xfaf0e6,
  magenta: 0xff00ff,
  maroon: 0x800000,
  mediumaquamarine: 0x66cdaa,
  mediumblue: 0x0000cd,
  mediumorchid: 0xba55d3,
  mediumpurple: 0x9370db,
  mediumseagreen: 0x3cb371,
  mediumslateblue: 0x7b68ee,
  mediumspringgreen: 0x00fa9a,
  mediumturquoise: 0x48d1cc,
  mediumvioletred: 0xc71585,
  midnightblue: 0x191970,
  mintcream: 0xf5fffa,
  mistyrose: 0xffe4e1,
  moccasin: 0xffe4b5,
  navajowhite: 0xffdead,
  navy: 0x000080,
  oldlace: 0xfdf5e6,
  olive: 0x808000,
  olivedrab: 0x6b8e23,
  orange: 0xffa500,
  orangered: 0xff4500,
  orchid: 0xda70d6,
  palegoldenrod: 0xeee8aa,
  palegreen: 0x98fb98,
  paleturquoise: 0xafeeee,
  palevioletred: 0xdb7093,
  papayawhip: 0xffefd5,
  peachpuff: 0xffdab9,
  peru: 0xcd853f,
  pink: 0xffc0cb,
  plum: 0xdda0dd,
  powderblue: 0xb0e0e6,
  purple: 0x800080,
  rebeccapurple: 0x663399,
  red: 0xff0000,
  rosybrown: 0xbc8f8f,
  royalblue: 0x4169e1,
  saddlebrown: 0x8b4513,
  salmon: 0xfa8072,
  sandybrown: 0xf4a460,
  seagreen: 0x2e8b57,
  seashell: 0xfff5ee,
  sienna: 0xa0522d,
  silver: 0xc0c0c0,
  skyblue: 0x87ceeb,
  slateblue: 0x6a5acd,
  slategray: 0x708090,
  slategrey: 0x708090,
  snow: 0xfffafa,
  springgreen: 0x00ff7f,
  steelblue: 0x4682b4,
  tan: 0xd2b48c,
  teal: 0x008080,
  thistle: 0xd8bfd8,
  tomato: 0xff6347,
  turquoise: 0x40e0d0,
  violet: 0xee82ee,
  wheat: 0xf5deb3,
  white: 0xffffff,
  whitesmoke: 0xf5f5f5,
  yellow: 0xffff00,
  yellowgreen: 0x9acd32
};

define(Color, color, {
  copy(channels) {
    return Object.assign(new this.constructor, this, channels);
  },
  displayable() {
    return this.rgb().displayable();
  },
  hex: color_formatHex, // Deprecated! Use color.formatHex.
  formatHex: color_formatHex,
  formatHex8: color_formatHex8,
  formatHsl: color_formatHsl,
  formatRgb: color_formatRgb,
  toString: color_formatRgb
});

function color_formatHex() {
  return this.rgb().formatHex();
}

function color_formatHex8() {
  return this.rgb().formatHex8();
}

function color_formatHsl() {
  return hslConvert(this).formatHsl();
}

function color_formatRgb() {
  return this.rgb().formatRgb();
}

function color(format) {
  var m, l;
  format = (format + "").trim().toLowerCase();
  return (m = reHex.exec(format)) ? (l = m[1].length, m = parseInt(m[1], 16), l === 6 ? rgbn(m) // #ff0000
      : l === 3 ? new Rgb((m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), ((m & 0xf) << 4) | (m & 0xf), 1) // #f00
      : l === 8 ? rgba(m >> 24 & 0xff, m >> 16 & 0xff, m >> 8 & 0xff, (m & 0xff) / 0xff) // #ff000000
      : l === 4 ? rgba((m >> 12 & 0xf) | (m >> 8 & 0xf0), (m >> 8 & 0xf) | (m >> 4 & 0xf0), (m >> 4 & 0xf) | (m & 0xf0), (((m & 0xf) << 4) | (m & 0xf)) / 0xff) // #f000
      : null) // invalid hex
      : (m = reRgbInteger.exec(format)) ? new Rgb(m[1], m[2], m[3], 1) // rgb(255, 0, 0)
      : (m = reRgbPercent.exec(format)) ? new Rgb(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, 1) // rgb(100%, 0%, 0%)
      : (m = reRgbaInteger.exec(format)) ? rgba(m[1], m[2], m[3], m[4]) // rgba(255, 0, 0, 1)
      : (m = reRgbaPercent.exec(format)) ? rgba(m[1] * 255 / 100, m[2] * 255 / 100, m[3] * 255 / 100, m[4]) // rgb(100%, 0%, 0%, 1)
      : (m = reHslPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, 1) // hsl(120, 50%, 50%)
      : (m = reHslaPercent.exec(format)) ? hsla(m[1], m[2] / 100, m[3] / 100, m[4]) // hsla(120, 50%, 50%, 1)
      : named.hasOwnProperty(format) ? rgbn(named[format]) // eslint-disable-line no-prototype-builtins
      : format === "transparent" ? new Rgb(NaN, NaN, NaN, 0)
      : null;
}

function rgbn(n) {
  return new Rgb(n >> 16 & 0xff, n >> 8 & 0xff, n & 0xff, 1);
}

function rgba(r, g, b, a) {
  if (a <= 0) r = g = b = NaN;
  return new Rgb(r, g, b, a);
}

function rgbConvert(o) {
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Rgb;
  o = o.rgb();
  return new Rgb(o.r, o.g, o.b, o.opacity);
}

function rgb(r, g, b, opacity) {
  return arguments.length === 1 ? rgbConvert(r) : new Rgb(r, g, b, opacity == null ? 1 : opacity);
}

function Rgb(r, g, b, opacity) {
  this.r = +r;
  this.g = +g;
  this.b = +b;
  this.opacity = +opacity;
}

define(Rgb, rgb, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Rgb(this.r * k, this.g * k, this.b * k, this.opacity);
  },
  rgb() {
    return this;
  },
  clamp() {
    return new Rgb(clampi(this.r), clampi(this.g), clampi(this.b), clampa(this.opacity));
  },
  displayable() {
    return (-0.5 <= this.r && this.r < 255.5)
        && (-0.5 <= this.g && this.g < 255.5)
        && (-0.5 <= this.b && this.b < 255.5)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  hex: rgb_formatHex, // Deprecated! Use color.formatHex.
  formatHex: rgb_formatHex,
  formatHex8: rgb_formatHex8,
  formatRgb: rgb_formatRgb,
  toString: rgb_formatRgb
}));

function rgb_formatHex() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}`;
}

function rgb_formatHex8() {
  return `#${hex(this.r)}${hex(this.g)}${hex(this.b)}${hex((isNaN(this.opacity) ? 1 : this.opacity) * 255)}`;
}

function rgb_formatRgb() {
  const a = clampa(this.opacity);
  return `${a === 1 ? "rgb(" : "rgba("}${clampi(this.r)}, ${clampi(this.g)}, ${clampi(this.b)}${a === 1 ? ")" : `, ${a})`}`;
}

function clampa(opacity) {
  return isNaN(opacity) ? 1 : Math.max(0, Math.min(1, opacity));
}

function clampi(value) {
  return Math.max(0, Math.min(255, Math.round(value) || 0));
}

function hex(value) {
  value = clampi(value);
  return (value < 16 ? "0" : "") + value.toString(16);
}

function hsla(h, s, l, a) {
  if (a <= 0) h = s = l = NaN;
  else if (l <= 0 || l >= 1) h = s = NaN;
  else if (s <= 0) h = NaN;
  return new Hsl(h, s, l, a);
}

function hslConvert(o) {
  if (o instanceof Hsl) return new Hsl(o.h, o.s, o.l, o.opacity);
  if (!(o instanceof Color)) o = color(o);
  if (!o) return new Hsl;
  if (o instanceof Hsl) return o;
  o = o.rgb();
  var r = o.r / 255,
      g = o.g / 255,
      b = o.b / 255,
      min = Math.min(r, g, b),
      max = Math.max(r, g, b),
      h = NaN,
      s = max - min,
      l = (max + min) / 2;
  if (s) {
    if (r === max) h = (g - b) / s + (g < b) * 6;
    else if (g === max) h = (b - r) / s + 2;
    else h = (r - g) / s + 4;
    s /= l < 0.5 ? max + min : 2 - max - min;
    h *= 60;
  } else {
    s = l > 0 && l < 1 ? 0 : h;
  }
  return new Hsl(h, s, l, o.opacity);
}

function hsl(h, s, l, opacity) {
  return arguments.length === 1 ? hslConvert(h) : new Hsl(h, s, l, opacity == null ? 1 : opacity);
}

function Hsl(h, s, l, opacity) {
  this.h = +h;
  this.s = +s;
  this.l = +l;
  this.opacity = +opacity;
}

define(Hsl, hsl, extend(Color, {
  brighter(k) {
    k = k == null ? brighter : Math.pow(brighter, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  darker(k) {
    k = k == null ? darker : Math.pow(darker, k);
    return new Hsl(this.h, this.s, this.l * k, this.opacity);
  },
  rgb() {
    var h = this.h % 360 + (this.h < 0) * 360,
        s = isNaN(h) || isNaN(this.s) ? 0 : this.s,
        l = this.l,
        m2 = l + (l < 0.5 ? l : 1 - l) * s,
        m1 = 2 * l - m2;
    return new Rgb(
      hsl2rgb(h >= 240 ? h - 240 : h + 120, m1, m2),
      hsl2rgb(h, m1, m2),
      hsl2rgb(h < 120 ? h + 240 : h - 120, m1, m2),
      this.opacity
    );
  },
  clamp() {
    return new Hsl(clamph(this.h), clampt(this.s), clampt(this.l), clampa(this.opacity));
  },
  displayable() {
    return (0 <= this.s && this.s <= 1 || isNaN(this.s))
        && (0 <= this.l && this.l <= 1)
        && (0 <= this.opacity && this.opacity <= 1);
  },
  formatHsl() {
    const a = clampa(this.opacity);
    return `${a === 1 ? "hsl(" : "hsla("}${clamph(this.h)}, ${clampt(this.s) * 100}%, ${clampt(this.l) * 100}%${a === 1 ? ")" : `, ${a})`}`;
  }
}));

function clamph(value) {
  value = (value || 0) % 360;
  return value < 0 ? value + 360 : value;
}

function clampt(value) {
  return Math.max(0, Math.min(1, value || 0));
}

/* From FvD 13.37, CSS Color Module Level 3 */
function hsl2rgb(h, m1, m2) {
  return (h < 60 ? m1 + (m2 - m1) * h / 60
      : h < 180 ? m2
      : h < 240 ? m1 + (m2 - m1) * (240 - h) / 60
      : m1) * 255;
}

var constant$2 = x => () => x;

function linear(a, d) {
  return function(t) {
    return a + t * d;
  };
}

function exponential(a, b, y) {
  return a = Math.pow(a, y), b = Math.pow(b, y) - a, y = 1 / y, function(t) {
    return Math.pow(a + t * b, y);
  };
}

function gamma(y) {
  return (y = +y) === 1 ? nogamma : function(a, b) {
    return b - a ? exponential(a, b, y) : constant$2(isNaN(a) ? b : a);
  };
}

function nogamma(a, b) {
  var d = b - a;
  return d ? linear(a, d) : constant$2(isNaN(a) ? b : a);
}

var interpolateRgb = (function rgbGamma(y) {
  var color = gamma(y);

  function rgb$1(start, end) {
    var r = color((start = rgb(start)).r, (end = rgb(end)).r),
        g = color(start.g, end.g),
        b = color(start.b, end.b),
        opacity = nogamma(start.opacity, end.opacity);
    return function(t) {
      start.r = r(t);
      start.g = g(t);
      start.b = b(t);
      start.opacity = opacity(t);
      return start + "";
    };
  }

  rgb$1.gamma = rgbGamma;

  return rgb$1;
})(1);

function interpolateNumber(a, b) {
  return a = +a, b = +b, function(t) {
    return a * (1 - t) + b * t;
  };
}

var reA = /[-+]?(?:\d+\.?\d*|\.?\d+)(?:[eE][-+]?\d+)?/g,
    reB = new RegExp(reA.source, "g");

function zero(b) {
  return function() {
    return b;
  };
}

function one(b) {
  return function(t) {
    return b(t) + "";
  };
}

function interpolateString(a, b) {
  var bi = reA.lastIndex = reB.lastIndex = 0, // scan index for next number in b
      am, // current match in a
      bm, // current match in b
      bs, // string preceding current number in b, if any
      i = -1, // index in s
      s = [], // string constants and placeholders
      q = []; // number interpolators

  // Coerce inputs to strings.
  a = a + "", b = b + "";

  // Interpolate pairs of numbers in a & b.
  while ((am = reA.exec(a))
      && (bm = reB.exec(b))) {
    if ((bs = bm.index) > bi) { // a string precedes the next number in b
      bs = b.slice(bi, bs);
      if (s[i]) s[i] += bs; // coalesce with previous string
      else s[++i] = bs;
    }
    if ((am = am[0]) === (bm = bm[0])) { // numbers in a & b match
      if (s[i]) s[i] += bm; // coalesce with previous string
      else s[++i] = bm;
    } else { // interpolate non-matching numbers
      s[++i] = null;
      q.push({i: i, x: interpolateNumber(am, bm)});
    }
    bi = reB.lastIndex;
  }

  // Add remains of b.
  if (bi < b.length) {
    bs = b.slice(bi);
    if (s[i]) s[i] += bs; // coalesce with previous string
    else s[++i] = bs;
  }

  // Special optimization for only a single match.
  // Otherwise, interpolate each of the numbers and rejoin the string.
  return s.length < 2 ? (q[0]
      ? one(q[0].x)
      : zero(b))
      : (b = q.length, function(t) {
          for (var i = 0, o; i < b; ++i) s[(o = q[i]).i] = o.x(t);
          return s.join("");
        });
}

var degrees = 180 / Math.PI;

var identity$1 = {
  translateX: 0,
  translateY: 0,
  rotate: 0,
  skewX: 0,
  scaleX: 1,
  scaleY: 1
};

function decompose(a, b, c, d, e, f) {
  var scaleX, scaleY, skewX;
  if (scaleX = Math.sqrt(a * a + b * b)) a /= scaleX, b /= scaleX;
  if (skewX = a * c + b * d) c -= a * skewX, d -= b * skewX;
  if (scaleY = Math.sqrt(c * c + d * d)) c /= scaleY, d /= scaleY, skewX /= scaleY;
  if (a * d < b * c) a = -a, b = -b, skewX = -skewX, scaleX = -scaleX;
  return {
    translateX: e,
    translateY: f,
    rotate: Math.atan2(b, a) * degrees,
    skewX: Math.atan(skewX) * degrees,
    scaleX: scaleX,
    scaleY: scaleY
  };
}

var svgNode;

/* eslint-disable no-undef */
function parseCss(value) {
  const m = new (typeof DOMMatrix === "function" ? DOMMatrix : WebKitCSSMatrix)(value + "");
  return m.isIdentity ? identity$1 : decompose(m.a, m.b, m.c, m.d, m.e, m.f);
}

function parseSvg(value) {
  if (value == null) return identity$1;
  if (!svgNode) svgNode = document.createElementNS("http://www.w3.org/2000/svg", "g");
  svgNode.setAttribute("transform", value);
  if (!(value = svgNode.transform.baseVal.consolidate())) return identity$1;
  value = value.matrix;
  return decompose(value.a, value.b, value.c, value.d, value.e, value.f);
}

function interpolateTransform(parse, pxComma, pxParen, degParen) {

  function pop(s) {
    return s.length ? s.pop() + " " : "";
  }

  function translate(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push("translate(", null, pxComma, null, pxParen);
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb || yb) {
      s.push("translate(" + xb + pxComma + yb + pxParen);
    }
  }

  function rotate(a, b, s, q) {
    if (a !== b) {
      if (a - b > 180) b += 360; else if (b - a > 180) a += 360; // shortest path
      q.push({i: s.push(pop(s) + "rotate(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "rotate(" + b + degParen);
    }
  }

  function skewX(a, b, s, q) {
    if (a !== b) {
      q.push({i: s.push(pop(s) + "skewX(", null, degParen) - 2, x: interpolateNumber(a, b)});
    } else if (b) {
      s.push(pop(s) + "skewX(" + b + degParen);
    }
  }

  function scale(xa, ya, xb, yb, s, q) {
    if (xa !== xb || ya !== yb) {
      var i = s.push(pop(s) + "scale(", null, ",", null, ")");
      q.push({i: i - 4, x: interpolateNumber(xa, xb)}, {i: i - 2, x: interpolateNumber(ya, yb)});
    } else if (xb !== 1 || yb !== 1) {
      s.push(pop(s) + "scale(" + xb + "," + yb + ")");
    }
  }

  return function(a, b) {
    var s = [], // string constants and placeholders
        q = []; // number interpolators
    a = parse(a), b = parse(b);
    translate(a.translateX, a.translateY, b.translateX, b.translateY, s, q);
    rotate(a.rotate, b.rotate, s, q);
    skewX(a.skewX, b.skewX, s, q);
    scale(a.scaleX, a.scaleY, b.scaleX, b.scaleY, s, q);
    a = b = null; // gc
    return function(t) {
      var i = -1, n = q.length, o;
      while (++i < n) s[(o = q[i]).i] = o.x(t);
      return s.join("");
    };
  };
}

var interpolateTransformCss = interpolateTransform(parseCss, "px, ", "px)", "deg)");
var interpolateTransformSvg = interpolateTransform(parseSvg, ", ", ")", ")");

var epsilon2 = 1e-12;

function cosh(x) {
  return ((x = Math.exp(x)) + 1 / x) / 2;
}

function sinh(x) {
  return ((x = Math.exp(x)) - 1 / x) / 2;
}

function tanh(x) {
  return ((x = Math.exp(2 * x)) - 1) / (x + 1);
}

var interpolateZoom = (function zoomRho(rho, rho2, rho4) {

  // p0 = [ux0, uy0, w0]
  // p1 = [ux1, uy1, w1]
  function zoom(p0, p1) {
    var ux0 = p0[0], uy0 = p0[1], w0 = p0[2],
        ux1 = p1[0], uy1 = p1[1], w1 = p1[2],
        dx = ux1 - ux0,
        dy = uy1 - uy0,
        d2 = dx * dx + dy * dy,
        i,
        S;

    // Special case for u0 ≅ u1.
    if (d2 < epsilon2) {
      S = Math.log(w1 / w0) / rho;
      i = function(t) {
        return [
          ux0 + t * dx,
          uy0 + t * dy,
          w0 * Math.exp(rho * t * S)
        ];
      };
    }

    // General case.
    else {
      var d1 = Math.sqrt(d2),
          b0 = (w1 * w1 - w0 * w0 + rho4 * d2) / (2 * w0 * rho2 * d1),
          b1 = (w1 * w1 - w0 * w0 - rho4 * d2) / (2 * w1 * rho2 * d1),
          r0 = Math.log(Math.sqrt(b0 * b0 + 1) - b0),
          r1 = Math.log(Math.sqrt(b1 * b1 + 1) - b1);
      S = (r1 - r0) / rho;
      i = function(t) {
        var s = t * S,
            coshr0 = cosh(r0),
            u = w0 / (rho2 * d1) * (coshr0 * tanh(rho * s + r0) - sinh(r0));
        return [
          ux0 + u * dx,
          uy0 + u * dy,
          w0 * coshr0 / cosh(rho * s + r0)
        ];
      };
    }

    i.duration = S * 1000 * rho / Math.SQRT2;

    return i;
  }

  zoom.rho = function(_) {
    var _1 = Math.max(1e-3, +_), _2 = _1 * _1, _4 = _2 * _2;
    return zoomRho(_1, _2, _4);
  };

  return zoom;
})(Math.SQRT2, 2, 4);

var frame = 0, // is an animation frame pending?
    timeout$1 = 0, // is a timeout pending?
    interval = 0, // are any timers active?
    pokeDelay = 1000, // how frequently we check for clock skew
    taskHead,
    taskTail,
    clockLast = 0,
    clockNow = 0,
    clockSkew = 0,
    clock = typeof performance === "object" && performance.now ? performance : Date,
    setFrame = typeof window === "object" && window.requestAnimationFrame ? window.requestAnimationFrame.bind(window) : function(f) { setTimeout(f, 17); };

function now() {
  return clockNow || (setFrame(clearNow), clockNow = clock.now() + clockSkew);
}

function clearNow() {
  clockNow = 0;
}

function Timer() {
  this._call =
  this._time =
  this._next = null;
}

Timer.prototype = timer.prototype = {
  constructor: Timer,
  restart: function(callback, delay, time) {
    if (typeof callback !== "function") throw new TypeError("callback is not a function");
    time = (time == null ? now() : +time) + (delay == null ? 0 : +delay);
    if (!this._next && taskTail !== this) {
      if (taskTail) taskTail._next = this;
      else taskHead = this;
      taskTail = this;
    }
    this._call = callback;
    this._time = time;
    sleep();
  },
  stop: function() {
    if (this._call) {
      this._call = null;
      this._time = Infinity;
      sleep();
    }
  }
};

function timer(callback, delay, time) {
  var t = new Timer;
  t.restart(callback, delay, time);
  return t;
}

function timerFlush() {
  now(); // Get the current time, if not already set.
  ++frame; // Pretend we’ve set an alarm, if we haven’t already.
  var t = taskHead, e;
  while (t) {
    if ((e = clockNow - t._time) >= 0) t._call.call(undefined, e);
    t = t._next;
  }
  --frame;
}

function wake() {
  clockNow = (clockLast = clock.now()) + clockSkew;
  frame = timeout$1 = 0;
  try {
    timerFlush();
  } finally {
    frame = 0;
    nap();
    clockNow = 0;
  }
}

function poke() {
  var now = clock.now(), delay = now - clockLast;
  if (delay > pokeDelay) clockSkew -= delay, clockLast = now;
}

function nap() {
  var t0, t1 = taskHead, t2, time = Infinity;
  while (t1) {
    if (t1._call) {
      if (time > t1._time) time = t1._time;
      t0 = t1, t1 = t1._next;
    } else {
      t2 = t1._next, t1._next = null;
      t1 = t0 ? t0._next = t2 : taskHead = t2;
    }
  }
  taskTail = t0;
  sleep(time);
}

function sleep(time) {
  if (frame) return; // Soonest alarm already set, or will be.
  if (timeout$1) timeout$1 = clearTimeout(timeout$1);
  var delay = time - clockNow; // Strictly less than if we recomputed clockNow.
  if (delay > 24) {
    if (time < Infinity) timeout$1 = setTimeout(wake, time - clock.now() - clockSkew);
    if (interval) interval = clearInterval(interval);
  } else {
    if (!interval) clockLast = clock.now(), interval = setInterval(poke, pokeDelay);
    frame = 1, setFrame(wake);
  }
}

function timeout(callback, delay, time) {
  var t = new Timer;
  delay = delay == null ? 0 : +delay;
  t.restart(elapsed => {
    t.stop();
    callback(elapsed + delay);
  }, delay, time);
  return t;
}

var emptyOn = dispatch("start", "end", "cancel", "interrupt");
var emptyTween = [];

var CREATED = 0;
var SCHEDULED = 1;
var STARTING = 2;
var STARTED = 3;
var RUNNING = 4;
var ENDING = 5;
var ENDED = 6;

function schedule(node, name, id, index, group, timing) {
  var schedules = node.__transition;
  if (!schedules) node.__transition = {};
  else if (id in schedules) return;
  create(node, id, {
    name: name,
    index: index, // For context during callback.
    group: group, // For context during callback.
    on: emptyOn,
    tween: emptyTween,
    time: timing.time,
    delay: timing.delay,
    duration: timing.duration,
    ease: timing.ease,
    timer: null,
    state: CREATED
  });
}

function init(node, id) {
  var schedule = get(node, id);
  if (schedule.state > CREATED) throw new Error("too late; already scheduled");
  return schedule;
}

function set(node, id) {
  var schedule = get(node, id);
  if (schedule.state > STARTED) throw new Error("too late; already running");
  return schedule;
}

function get(node, id) {
  var schedule = node.__transition;
  if (!schedule || !(schedule = schedule[id])) throw new Error("transition not found");
  return schedule;
}

function create(node, id, self) {
  var schedules = node.__transition,
      tween;

  // Initialize the self timer when the transition is created.
  // Note the actual delay is not known until the first callback!
  schedules[id] = self;
  self.timer = timer(schedule, 0, self.time);

  function schedule(elapsed) {
    self.state = SCHEDULED;
    self.timer.restart(start, self.delay, self.time);

    // If the elapsed delay is less than our first sleep, start immediately.
    if (self.delay <= elapsed) start(elapsed - self.delay);
  }

  function start(elapsed) {
    var i, j, n, o;

    // If the state is not SCHEDULED, then we previously errored on start.
    if (self.state !== SCHEDULED) return stop();

    for (i in schedules) {
      o = schedules[i];
      if (o.name !== self.name) continue;

      // While this element already has a starting transition during this frame,
      // defer starting an interrupting transition until that transition has a
      // chance to tick (and possibly end); see d3/d3-transition#54!
      if (o.state === STARTED) return timeout(start);

      // Interrupt the active transition, if any.
      if (o.state === RUNNING) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("interrupt", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }

      // Cancel any pre-empted transitions.
      else if (+i < id) {
        o.state = ENDED;
        o.timer.stop();
        o.on.call("cancel", node, node.__data__, o.index, o.group);
        delete schedules[i];
      }
    }

    // Defer the first tick to end of the current frame; see d3/d3#1576.
    // Note the transition may be canceled after start and before the first tick!
    // Note this must be scheduled before the start event; see d3/d3-transition#16!
    // Assuming this is successful, subsequent callbacks go straight to tick.
    timeout(function() {
      if (self.state === STARTED) {
        self.state = RUNNING;
        self.timer.restart(tick, self.delay, self.time);
        tick(elapsed);
      }
    });

    // Dispatch the start event.
    // Note this must be done before the tween are initialized.
    self.state = STARTING;
    self.on.call("start", node, node.__data__, self.index, self.group);
    if (self.state !== STARTING) return; // interrupted
    self.state = STARTED;

    // Initialize the tween, deleting null tween.
    tween = new Array(n = self.tween.length);
    for (i = 0, j = -1; i < n; ++i) {
      if (o = self.tween[i].value.call(node, node.__data__, self.index, self.group)) {
        tween[++j] = o;
      }
    }
    tween.length = j + 1;
  }

  function tick(elapsed) {
    var t = elapsed < self.duration ? self.ease.call(null, elapsed / self.duration) : (self.timer.restart(stop), self.state = ENDING, 1),
        i = -1,
        n = tween.length;

    while (++i < n) {
      tween[i].call(node, t);
    }

    // Dispatch the end event.
    if (self.state === ENDING) {
      self.on.call("end", node, node.__data__, self.index, self.group);
      stop();
    }
  }

  function stop() {
    self.state = ENDED;
    self.timer.stop();
    delete schedules[id];
    for (var i in schedules) return; // eslint-disable-line no-unused-vars
    delete node.__transition;
  }
}

function interrupt(node, name) {
  var schedules = node.__transition,
      schedule,
      active,
      empty = true,
      i;

  if (!schedules) return;

  name = name == null ? null : name + "";

  for (i in schedules) {
    if ((schedule = schedules[i]).name !== name) { empty = false; continue; }
    active = schedule.state > STARTING && schedule.state < ENDING;
    schedule.state = ENDED;
    schedule.timer.stop();
    schedule.on.call(active ? "interrupt" : "cancel", node, node.__data__, schedule.index, schedule.group);
    delete schedules[i];
  }

  if (empty) delete node.__transition;
}

function selection_interrupt(name) {
  return this.each(function() {
    interrupt(this, name);
  });
}

function tweenRemove(id, name) {
  var tween0, tween1;
  return function() {
    var schedule = set(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = tween0 = tween;
      for (var i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1 = tween1.slice();
          tween1.splice(i, 1);
          break;
        }
      }
    }

    schedule.tween = tween1;
  };
}

function tweenFunction(id, name, value) {
  var tween0, tween1;
  if (typeof value !== "function") throw new Error;
  return function() {
    var schedule = set(this, id),
        tween = schedule.tween;

    // If this node shared tween with the previous node,
    // just assign the updated shared tween and we’re done!
    // Otherwise, copy-on-write.
    if (tween !== tween0) {
      tween1 = (tween0 = tween).slice();
      for (var t = {name: name, value: value}, i = 0, n = tween1.length; i < n; ++i) {
        if (tween1[i].name === name) {
          tween1[i] = t;
          break;
        }
      }
      if (i === n) tween1.push(t);
    }

    schedule.tween = tween1;
  };
}

function transition_tween(name, value) {
  var id = this._id;

  name += "";

  if (arguments.length < 2) {
    var tween = get(this.node(), id).tween;
    for (var i = 0, n = tween.length, t; i < n; ++i) {
      if ((t = tween[i]).name === name) {
        return t.value;
      }
    }
    return null;
  }

  return this.each((value == null ? tweenRemove : tweenFunction)(id, name, value));
}

function tweenValue(transition, name, value) {
  var id = transition._id;

  transition.each(function() {
    var schedule = set(this, id);
    (schedule.value || (schedule.value = {}))[name] = value.apply(this, arguments);
  });

  return function(node) {
    return get(node, id).value[name];
  };
}

function interpolate(a, b) {
  var c;
  return (typeof b === "number" ? interpolateNumber
      : b instanceof color ? interpolateRgb
      : (c = color(b)) ? (b = c, interpolateRgb)
      : interpolateString)(a, b);
}

function attrRemove(name) {
  return function() {
    this.removeAttribute(name);
  };
}

function attrRemoveNS(fullname) {
  return function() {
    this.removeAttributeNS(fullname.space, fullname.local);
  };
}

function attrConstant(name, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = this.getAttribute(name);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function attrConstantNS(fullname, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = this.getAttributeNS(fullname.space, fullname.local);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function attrFunction(name, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttribute(name);
    string0 = this.getAttribute(name);
    string1 = value1 + "";
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function attrFunctionNS(fullname, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0, value1 = value(this), string1;
    if (value1 == null) return void this.removeAttributeNS(fullname.space, fullname.local);
    string0 = this.getAttributeNS(fullname.space, fullname.local);
    string1 = value1 + "";
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function transition_attr(name, value) {
  var fullname = namespace(name), i = fullname === "transform" ? interpolateTransformSvg : interpolate;
  return this.attrTween(name, typeof value === "function"
      ? (fullname.local ? attrFunctionNS : attrFunction)(fullname, i, tweenValue(this, "attr." + name, value))
      : value == null ? (fullname.local ? attrRemoveNS : attrRemove)(fullname)
      : (fullname.local ? attrConstantNS : attrConstant)(fullname, i, value));
}

function attrInterpolate(name, i) {
  return function(t) {
    this.setAttribute(name, i.call(this, t));
  };
}

function attrInterpolateNS(fullname, i) {
  return function(t) {
    this.setAttributeNS(fullname.space, fullname.local, i.call(this, t));
  };
}

function attrTweenNS(fullname, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolateNS(fullname, i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function attrTween(name, value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && attrInterpolate(name, i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function transition_attrTween(name, value) {
  var key = "attr." + name;
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  var fullname = namespace(name);
  return this.tween(key, (fullname.local ? attrTweenNS : attrTween)(fullname, value));
}

function delayFunction(id, value) {
  return function() {
    init(this, id).delay = +value.apply(this, arguments);
  };
}

function delayConstant(id, value) {
  return value = +value, function() {
    init(this, id).delay = value;
  };
}

function transition_delay(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? delayFunction
          : delayConstant)(id, value))
      : get(this.node(), id).delay;
}

function durationFunction(id, value) {
  return function() {
    set(this, id).duration = +value.apply(this, arguments);
  };
}

function durationConstant(id, value) {
  return value = +value, function() {
    set(this, id).duration = value;
  };
}

function transition_duration(value) {
  var id = this._id;

  return arguments.length
      ? this.each((typeof value === "function"
          ? durationFunction
          : durationConstant)(id, value))
      : get(this.node(), id).duration;
}

function easeConstant(id, value) {
  if (typeof value !== "function") throw new Error;
  return function() {
    set(this, id).ease = value;
  };
}

function transition_ease(value) {
  var id = this._id;

  return arguments.length
      ? this.each(easeConstant(id, value))
      : get(this.node(), id).ease;
}

function easeVarying(id, value) {
  return function() {
    var v = value.apply(this, arguments);
    if (typeof v !== "function") throw new Error;
    set(this, id).ease = v;
  };
}

function transition_easeVarying(value) {
  if (typeof value !== "function") throw new Error;
  return this.each(easeVarying(this._id, value));
}

function transition_filter(match) {
  if (typeof match !== "function") match = matcher(match);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = [], node, i = 0; i < n; ++i) {
      if ((node = group[i]) && match.call(node, node.__data__, i, group)) {
        subgroup.push(node);
      }
    }
  }

  return new Transition(subgroups, this._parents, this._name, this._id);
}

function transition_merge(transition) {
  if (transition._id !== this._id) throw new Error;

  for (var groups0 = this._groups, groups1 = transition._groups, m0 = groups0.length, m1 = groups1.length, m = Math.min(m0, m1), merges = new Array(m0), j = 0; j < m; ++j) {
    for (var group0 = groups0[j], group1 = groups1[j], n = group0.length, merge = merges[j] = new Array(n), node, i = 0; i < n; ++i) {
      if (node = group0[i] || group1[i]) {
        merge[i] = node;
      }
    }
  }

  for (; j < m0; ++j) {
    merges[j] = groups0[j];
  }

  return new Transition(merges, this._parents, this._name, this._id);
}

function start(name) {
  return (name + "").trim().split(/^|\s+/).every(function(t) {
    var i = t.indexOf(".");
    if (i >= 0) t = t.slice(0, i);
    return !t || t === "start";
  });
}

function onFunction(id, name, listener) {
  var on0, on1, sit = start(name) ? init : set;
  return function() {
    var schedule = sit(this, id),
        on = schedule.on;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0) (on1 = (on0 = on).copy()).on(name, listener);

    schedule.on = on1;
  };
}

function transition_on(name, listener) {
  var id = this._id;

  return arguments.length < 2
      ? get(this.node(), id).on.on(name)
      : this.each(onFunction(id, name, listener));
}

function removeFunction(id) {
  return function() {
    var parent = this.parentNode;
    for (var i in this.__transition) if (+i !== id) return;
    if (parent) parent.removeChild(this);
  };
}

function transition_remove() {
  return this.on("end.remove", removeFunction(this._id));
}

function transition_select(select) {
  var name = this._name,
      id = this._id;

  if (typeof select !== "function") select = selector(select);

  for (var groups = this._groups, m = groups.length, subgroups = new Array(m), j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, subgroup = subgroups[j] = new Array(n), node, subnode, i = 0; i < n; ++i) {
      if ((node = group[i]) && (subnode = select.call(node, node.__data__, i, group))) {
        if ("__data__" in node) subnode.__data__ = node.__data__;
        subgroup[i] = subnode;
        schedule(subgroup[i], name, id, i, subgroup, get(node, id));
      }
    }
  }

  return new Transition(subgroups, this._parents, name, id);
}

function transition_selectAll(select) {
  var name = this._name,
      id = this._id;

  if (typeof select !== "function") select = selectorAll(select);

  for (var groups = this._groups, m = groups.length, subgroups = [], parents = [], j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        for (var children = select.call(node, node.__data__, i, group), child, inherit = get(node, id), k = 0, l = children.length; k < l; ++k) {
          if (child = children[k]) {
            schedule(child, name, id, k, children, inherit);
          }
        }
        subgroups.push(children);
        parents.push(node);
      }
    }
  }

  return new Transition(subgroups, parents, name, id);
}

var Selection = selection.prototype.constructor;

function transition_selection() {
  return new Selection(this._groups, this._parents);
}

function styleNull(name, interpolate) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0 = styleValue(this, name),
        string1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, string10 = string1);
  };
}

function styleRemove(name) {
  return function() {
    this.style.removeProperty(name);
  };
}

function styleConstant(name, interpolate, value1) {
  var string00,
      string1 = value1 + "",
      interpolate0;
  return function() {
    var string0 = styleValue(this, name);
    return string0 === string1 ? null
        : string0 === string00 ? interpolate0
        : interpolate0 = interpolate(string00 = string0, value1);
  };
}

function styleFunction(name, interpolate, value) {
  var string00,
      string10,
      interpolate0;
  return function() {
    var string0 = styleValue(this, name),
        value1 = value(this),
        string1 = value1 + "";
    if (value1 == null) string1 = value1 = (this.style.removeProperty(name), styleValue(this, name));
    return string0 === string1 ? null
        : string0 === string00 && string1 === string10 ? interpolate0
        : (string10 = string1, interpolate0 = interpolate(string00 = string0, value1));
  };
}

function styleMaybeRemove(id, name) {
  var on0, on1, listener0, key = "style." + name, event = "end." + key, remove;
  return function() {
    var schedule = set(this, id),
        on = schedule.on,
        listener = schedule.value[key] == null ? remove || (remove = styleRemove(name)) : undefined;

    // If this node shared a dispatch with the previous node,
    // just assign the updated shared dispatch and we’re done!
    // Otherwise, copy-on-write.
    if (on !== on0 || listener0 !== listener) (on1 = (on0 = on).copy()).on(event, listener0 = listener);

    schedule.on = on1;
  };
}

function transition_style(name, value, priority) {
  var i = (name += "") === "transform" ? interpolateTransformCss : interpolate;
  return value == null ? this
      .styleTween(name, styleNull(name, i))
      .on("end.style." + name, styleRemove(name))
    : typeof value === "function" ? this
      .styleTween(name, styleFunction(name, i, tweenValue(this, "style." + name, value)))
      .each(styleMaybeRemove(this._id, name))
    : this
      .styleTween(name, styleConstant(name, i, value), priority)
      .on("end.style." + name, null);
}

function styleInterpolate(name, i, priority) {
  return function(t) {
    this.style.setProperty(name, i.call(this, t), priority);
  };
}

function styleTween(name, value, priority) {
  var t, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t = (i0 = i) && styleInterpolate(name, i, priority);
    return t;
  }
  tween._value = value;
  return tween;
}

function transition_styleTween(name, value, priority) {
  var key = "style." + (name += "");
  if (arguments.length < 2) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  return this.tween(key, styleTween(name, value, priority == null ? "" : priority));
}

function textConstant(value) {
  return function() {
    this.textContent = value;
  };
}

function textFunction(value) {
  return function() {
    var value1 = value(this);
    this.textContent = value1 == null ? "" : value1;
  };
}

function transition_text(value) {
  return this.tween("text", typeof value === "function"
      ? textFunction(tweenValue(this, "text", value))
      : textConstant(value == null ? "" : value + ""));
}

function textInterpolate(i) {
  return function(t) {
    this.textContent = i.call(this, t);
  };
}

function textTween(value) {
  var t0, i0;
  function tween() {
    var i = value.apply(this, arguments);
    if (i !== i0) t0 = (i0 = i) && textInterpolate(i);
    return t0;
  }
  tween._value = value;
  return tween;
}

function transition_textTween(value) {
  var key = "text";
  if (arguments.length < 1) return (key = this.tween(key)) && key._value;
  if (value == null) return this.tween(key, null);
  if (typeof value !== "function") throw new Error;
  return this.tween(key, textTween(value));
}

function transition_transition() {
  var name = this._name,
      id0 = this._id,
      id1 = newId();

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        var inherit = get(node, id0);
        schedule(node, name, id1, i, group, {
          time: inherit.time + inherit.delay + inherit.duration,
          delay: 0,
          duration: inherit.duration,
          ease: inherit.ease
        });
      }
    }
  }

  return new Transition(groups, this._parents, name, id1);
}

function transition_end() {
  var on0, on1, that = this, id = that._id, size = that.size();
  return new Promise(function(resolve, reject) {
    var cancel = {value: reject},
        end = {value: function() { if (--size === 0) resolve(); }};

    that.each(function() {
      var schedule = set(this, id),
          on = schedule.on;

      // If this node shared a dispatch with the previous node,
      // just assign the updated shared dispatch and we’re done!
      // Otherwise, copy-on-write.
      if (on !== on0) {
        on1 = (on0 = on).copy();
        on1._.cancel.push(cancel);
        on1._.interrupt.push(cancel);
        on1._.end.push(end);
      }

      schedule.on = on1;
    });

    // The selection was empty, resolve end immediately
    if (size === 0) resolve();
  });
}

var id = 0;

function Transition(groups, parents, name, id) {
  this._groups = groups;
  this._parents = parents;
  this._name = name;
  this._id = id;
}

function transition(name) {
  return selection().transition(name);
}

function newId() {
  return ++id;
}

var selection_prototype = selection.prototype;

Transition.prototype = transition.prototype = {
  constructor: Transition,
  select: transition_select,
  selectAll: transition_selectAll,
  selectChild: selection_prototype.selectChild,
  selectChildren: selection_prototype.selectChildren,
  filter: transition_filter,
  merge: transition_merge,
  selection: transition_selection,
  transition: transition_transition,
  call: selection_prototype.call,
  nodes: selection_prototype.nodes,
  node: selection_prototype.node,
  size: selection_prototype.size,
  empty: selection_prototype.empty,
  each: selection_prototype.each,
  on: transition_on,
  attr: transition_attr,
  attrTween: transition_attrTween,
  style: transition_style,
  styleTween: transition_styleTween,
  text: transition_text,
  textTween: transition_textTween,
  remove: transition_remove,
  tween: transition_tween,
  delay: transition_delay,
  duration: transition_duration,
  ease: transition_ease,
  easeVarying: transition_easeVarying,
  end: transition_end,
  [Symbol.iterator]: selection_prototype[Symbol.iterator]
};

function cubicInOut(t) {
  return ((t *= 2) <= 1 ? t * t * t : (t -= 2) * t * t + 2) / 2;
}

var defaultTiming = {
  time: null, // Set on use.
  delay: 0,
  duration: 250,
  ease: cubicInOut
};

function inherit(node, id) {
  var timing;
  while (!(timing = node.__transition) || !(timing = timing[id])) {
    if (!(node = node.parentNode)) {
      throw new Error(`transition ${id} not found`);
    }
  }
  return timing;
}

function selection_transition(name) {
  var id,
      timing;

  if (name instanceof Transition) {
    id = name._id, name = name._name;
  } else {
    id = newId(), (timing = defaultTiming).time = now(), name = name == null ? null : name + "";
  }

  for (var groups = this._groups, m = groups.length, j = 0; j < m; ++j) {
    for (var group = groups[j], n = group.length, node, i = 0; i < n; ++i) {
      if (node = group[i]) {
        schedule(node, name, id, i, group, timing || inherit(node, id));
      }
    }
  }

  return new Transition(groups, this._parents, name, id);
}

selection.prototype.interrupt = selection_interrupt;
selection.prototype.transition = selection_transition;

const pi$1 = Math.PI,
    tau$1 = 2 * pi$1,
    epsilon$1 = 1e-6,
    tauEpsilon = tau$1 - epsilon$1;

function append(strings) {
  this._ += strings[0];
  for (let i = 1, n = strings.length; i < n; ++i) {
    this._ += arguments[i] + strings[i];
  }
}

function appendRound(digits) {
  let d = Math.floor(digits);
  if (!(d >= 0)) throw new Error(`invalid digits: ${digits}`);
  if (d > 15) return append;
  const k = 10 ** d;
  return function(strings) {
    this._ += strings[0];
    for (let i = 1, n = strings.length; i < n; ++i) {
      this._ += Math.round(arguments[i] * k) / k + strings[i];
    }
  };
}

class Path {
  constructor(digits) {
    this._x0 = this._y0 = // start of current subpath
    this._x1 = this._y1 = null; // end of current subpath
    this._ = "";
    this._append = digits == null ? append : appendRound(digits);
  }
  moveTo(x, y) {
    this._append`M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}`;
  }
  closePath() {
    if (this._x1 !== null) {
      this._x1 = this._x0, this._y1 = this._y0;
      this._append`Z`;
    }
  }
  lineTo(x, y) {
    this._append`L${this._x1 = +x},${this._y1 = +y}`;
  }
  quadraticCurveTo(x1, y1, x, y) {
    this._append`Q${+x1},${+y1},${this._x1 = +x},${this._y1 = +y}`;
  }
  bezierCurveTo(x1, y1, x2, y2, x, y) {
    this._append`C${+x1},${+y1},${+x2},${+y2},${this._x1 = +x},${this._y1 = +y}`;
  }
  arcTo(x1, y1, x2, y2, r) {
    x1 = +x1, y1 = +y1, x2 = +x2, y2 = +y2, r = +r;

    // Is the radius negative? Error.
    if (r < 0) throw new Error(`negative radius: ${r}`);

    let x0 = this._x1,
        y0 = this._y1,
        x21 = x2 - x1,
        y21 = y2 - y1,
        x01 = x0 - x1,
        y01 = y0 - y1,
        l01_2 = x01 * x01 + y01 * y01;

    // Is this path empty? Move to (x1,y1).
    if (this._x1 === null) {
      this._append`M${this._x1 = x1},${this._y1 = y1}`;
    }

    // Or, is (x1,y1) coincident with (x0,y0)? Do nothing.
    else if (!(l01_2 > epsilon$1));

    // Or, are (x0,y0), (x1,y1) and (x2,y2) collinear?
    // Equivalently, is (x1,y1) coincident with (x2,y2)?
    // Or, is the radius zero? Line to (x1,y1).
    else if (!(Math.abs(y01 * x21 - y21 * x01) > epsilon$1) || !r) {
      this._append`L${this._x1 = x1},${this._y1 = y1}`;
    }

    // Otherwise, draw an arc!
    else {
      let x20 = x2 - x0,
          y20 = y2 - y0,
          l21_2 = x21 * x21 + y21 * y21,
          l20_2 = x20 * x20 + y20 * y20,
          l21 = Math.sqrt(l21_2),
          l01 = Math.sqrt(l01_2),
          l = r * Math.tan((pi$1 - Math.acos((l21_2 + l01_2 - l20_2) / (2 * l21 * l01))) / 2),
          t01 = l / l01,
          t21 = l / l21;

      // If the start tangent is not coincident with (x0,y0), line to.
      if (Math.abs(t01 - 1) > epsilon$1) {
        this._append`L${x1 + t01 * x01},${y1 + t01 * y01}`;
      }

      this._append`A${r},${r},0,0,${+(y01 * x20 > x01 * y20)},${this._x1 = x1 + t21 * x21},${this._y1 = y1 + t21 * y21}`;
    }
  }
  arc(x, y, r, a0, a1, ccw) {
    x = +x, y = +y, r = +r, ccw = !!ccw;

    // Is the radius negative? Error.
    if (r < 0) throw new Error(`negative radius: ${r}`);

    let dx = r * Math.cos(a0),
        dy = r * Math.sin(a0),
        x0 = x + dx,
        y0 = y + dy,
        cw = 1 ^ ccw,
        da = ccw ? a0 - a1 : a1 - a0;

    // Is this path empty? Move to (x0,y0).
    if (this._x1 === null) {
      this._append`M${x0},${y0}`;
    }

    // Or, is (x0,y0) not coincident with the previous point? Line to (x0,y0).
    else if (Math.abs(this._x1 - x0) > epsilon$1 || Math.abs(this._y1 - y0) > epsilon$1) {
      this._append`L${x0},${y0}`;
    }

    // Is this arc empty? We’re done.
    if (!r) return;

    // Does the angle go the wrong way? Flip the direction.
    if (da < 0) da = da % tau$1 + tau$1;

    // Is this a complete circle? Draw two arcs to complete the circle.
    if (da > tauEpsilon) {
      this._append`A${r},${r},0,1,${cw},${x - dx},${y - dy}A${r},${r},0,1,${cw},${this._x1 = x0},${this._y1 = y0}`;
    }

    // Is this arc non-empty? Draw an arc!
    else if (da > epsilon$1) {
      this._append`A${r},${r},0,${+(da >= pi$1)},${cw},${this._x1 = x + r * Math.cos(a1)},${this._y1 = y + r * Math.sin(a1)}`;
    }
  }
  rect(x, y, w, h) {
    this._append`M${this._x0 = this._x1 = +x},${this._y0 = this._y1 = +y}h${w = +w}v${+h}h${-w}Z`;
  }
  toString() {
    return this._;
  }
}

function defaultSeparation$1(a, b) {
  return a.parent === b.parent ? 1 : 2;
}

function meanX(children) {
  return children.reduce(meanXReduce, 0) / children.length;
}

function meanXReduce(x, c) {
  return x + c.x;
}

function maxY(children) {
  return 1 + children.reduce(maxYReduce, 0);
}

function maxYReduce(y, c) {
  return Math.max(y, c.y);
}

function leafLeft(node) {
  var children;
  while (children = node.children) node = children[0];
  return node;
}

function leafRight(node) {
  var children;
  while (children = node.children) node = children[children.length - 1];
  return node;
}

function cluster() {
  var separation = defaultSeparation$1,
      dx = 1,
      dy = 1,
      nodeSize = false;

  function cluster(root) {
    var previousNode,
        x = 0;

    // First walk, computing the initial x & y values.
    root.eachAfter(function(node) {
      var children = node.children;
      if (children) {
        node.x = meanX(children);
        node.y = maxY(children);
      } else {
        node.x = previousNode ? x += separation(node, previousNode) : 0;
        node.y = 0;
        previousNode = node;
      }
    });

    var left = leafLeft(root),
        right = leafRight(root),
        x0 = left.x - separation(left, right) / 2,
        x1 = right.x + separation(right, left) / 2;

    // Second walk, normalizing x & y to the desired size.
    return root.eachAfter(nodeSize ? function(node) {
      node.x = (node.x - root.x) * dx;
      node.y = (root.y - node.y) * dy;
    } : function(node) {
      node.x = (node.x - x0) / (x1 - x0) * dx;
      node.y = (1 - (root.y ? node.y / root.y : 1)) * dy;
    });
  }

  cluster.separation = function(x) {
    return arguments.length ? (separation = x, cluster) : separation;
  };

  cluster.size = function(x) {
    return arguments.length ? (nodeSize = false, dx = +x[0], dy = +x[1], cluster) : (nodeSize ? null : [dx, dy]);
  };

  cluster.nodeSize = function(x) {
    return arguments.length ? (nodeSize = true, dx = +x[0], dy = +x[1], cluster) : (nodeSize ? [dx, dy] : null);
  };

  return cluster;
}

function count(node) {
  var sum = 0,
      children = node.children,
      i = children && children.length;
  if (!i) sum = 1;
  else while (--i >= 0) sum += children[i].value;
  node.value = sum;
}

function node_count() {
  return this.eachAfter(count);
}

function node_each(callback, that) {
  let index = -1;
  for (const node of this) {
    callback.call(that, node, ++index, this);
  }
  return this;
}

function node_eachBefore(callback, that) {
  var node = this, nodes = [node], children, i, index = -1;
  while (node = nodes.pop()) {
    callback.call(that, node, ++index, this);
    if (children = node.children) {
      for (i = children.length - 1; i >= 0; --i) {
        nodes.push(children[i]);
      }
    }
  }
  return this;
}

function node_eachAfter(callback, that) {
  var node = this, nodes = [node], next = [], children, i, n, index = -1;
  while (node = nodes.pop()) {
    next.push(node);
    if (children = node.children) {
      for (i = 0, n = children.length; i < n; ++i) {
        nodes.push(children[i]);
      }
    }
  }
  while (node = next.pop()) {
    callback.call(that, node, ++index, this);
  }
  return this;
}

function node_find(callback, that) {
  let index = -1;
  for (const node of this) {
    if (callback.call(that, node, ++index, this)) {
      return node;
    }
  }
}

function node_sum(value) {
  return this.eachAfter(function(node) {
    var sum = +value(node.data) || 0,
        children = node.children,
        i = children && children.length;
    while (--i >= 0) sum += children[i].value;
    node.value = sum;
  });
}

function node_sort(compare) {
  return this.eachBefore(function(node) {
    if (node.children) {
      node.children.sort(compare);
    }
  });
}

function node_path(end) {
  var start = this,
      ancestor = leastCommonAncestor(start, end),
      nodes = [start];
  while (start !== ancestor) {
    start = start.parent;
    nodes.push(start);
  }
  var k = nodes.length;
  while (end !== ancestor) {
    nodes.splice(k, 0, end);
    end = end.parent;
  }
  return nodes;
}

function leastCommonAncestor(a, b) {
  if (a === b) return a;
  var aNodes = a.ancestors(),
      bNodes = b.ancestors(),
      c = null;
  a = aNodes.pop();
  b = bNodes.pop();
  while (a === b) {
    c = a;
    a = aNodes.pop();
    b = bNodes.pop();
  }
  return c;
}

function node_ancestors() {
  var node = this, nodes = [node];
  while (node = node.parent) {
    nodes.push(node);
  }
  return nodes;
}

function node_descendants() {
  return Array.from(this);
}

function node_leaves() {
  var leaves = [];
  this.eachBefore(function(node) {
    if (!node.children) {
      leaves.push(node);
    }
  });
  return leaves;
}

function node_links() {
  var root = this, links = [];
  root.each(function(node) {
    if (node !== root) { // Don’t include the root’s parent, if any.
      links.push({source: node.parent, target: node});
    }
  });
  return links;
}

function* node_iterator() {
  var node = this, current, next = [node], children, i, n;
  do {
    current = next.reverse(), next = [];
    while (node = current.pop()) {
      yield node;
      if (children = node.children) {
        for (i = 0, n = children.length; i < n; ++i) {
          next.push(children[i]);
        }
      }
    }
  } while (next.length);
}

function hierarchy(data, children) {
  if (data instanceof Map) {
    data = [undefined, data];
    if (children === undefined) children = mapChildren$2;
  } else if (children === undefined) {
    children = objectChildren;
  }

  var root = new Node(data),
      node,
      nodes = [root],
      child,
      childs,
      i,
      n;

  while (node = nodes.pop()) {
    if ((childs = children(node.data)) && (n = (childs = Array.from(childs)).length)) {
      node.children = childs;
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = childs[i] = new Node(childs[i]));
        child.parent = node;
        child.depth = node.depth + 1;
      }
    }
  }

  return root.eachBefore(computeHeight);
}

function node_copy() {
  return hierarchy(this).eachBefore(copyData);
}

function objectChildren(d) {
  return d.children;
}

function mapChildren$2(d) {
  return Array.isArray(d) ? d[1] : null;
}

function copyData(node) {
  if (node.data.value !== undefined) node.value = node.data.value;
  node.data = node.data.data;
}

function computeHeight(node) {
  var height = 0;
  do node.height = height;
  while ((node = node.parent) && (node.height < ++height));
}

function Node(data) {
  this.data = data;
  this.depth =
  this.height = 0;
  this.parent = null;
}

Node.prototype = hierarchy.prototype = {
  constructor: Node,
  count: node_count,
  each: node_each,
  eachAfter: node_eachAfter,
  eachBefore: node_eachBefore,
  find: node_find,
  sum: node_sum,
  sort: node_sort,
  path: node_path,
  ancestors: node_ancestors,
  descendants: node_descendants,
  leaves: node_leaves,
  links: node_links,
  copy: node_copy,
  [Symbol.iterator]: node_iterator
};

function defaultSeparation(a, b) {
  return a.parent === b.parent ? 1 : 2;
}

// function radialSeparation(a, b) {
//   return (a.parent === b.parent ? 1 : 2) / a.depth;
// }

// This function is used to traverse the left contour of a subtree (or
// subforest). It returns the successor of v on this contour. This successor is
// either given by the leftmost child of v or by the thread of v. The function
// returns null if and only if v is on the highest level of its subtree.
function nextLeft(v) {
  var children = v.children;
  return children ? children[0] : v.t;
}

// This function works analogously to nextLeft.
function nextRight(v) {
  var children = v.children;
  return children ? children[children.length - 1] : v.t;
}

// Shifts the current subtree rooted at w+. This is done by increasing
// prelim(w+) and mod(w+) by shift.
function moveSubtree(wm, wp, shift) {
  var change = shift / (wp.i - wm.i);
  wp.c -= change;
  wp.s += shift;
  wm.c += change;
  wp.z += shift;
  wp.m += shift;
}

// All other shifts, applied to the smaller subtrees between w- and w+, are
// performed by this function. To prepare the shifts, we have to adjust
// change(w+), shift(w+), and change(w-).
function executeShifts(v) {
  var shift = 0,
      change = 0,
      children = v.children,
      i = children.length,
      w;
  while (--i >= 0) {
    w = children[i];
    w.z += shift;
    w.m += shift;
    shift += w.s + (change += w.c);
  }
}

// If vi-’s ancestor is a sibling of v, returns vi-’s ancestor. Otherwise,
// returns the specified (default) ancestor.
function nextAncestor(vim, v, ancestor) {
  return vim.a.parent === v.parent ? vim.a : ancestor;
}

function TreeNode(node, i) {
  this._ = node;
  this.parent = null;
  this.children = null;
  this.A = null; // default ancestor
  this.a = this; // ancestor
  this.z = 0; // prelim
  this.m = 0; // mod
  this.c = 0; // change
  this.s = 0; // shift
  this.t = null; // thread
  this.i = i; // number
}

TreeNode.prototype = Object.create(Node.prototype);

function treeRoot(root) {
  var tree = new TreeNode(root, 0),
      node,
      nodes = [tree],
      child,
      children,
      i,
      n;

  while (node = nodes.pop()) {
    if (children = node._.children) {
      node.children = new Array(n = children.length);
      for (i = n - 1; i >= 0; --i) {
        nodes.push(child = node.children[i] = new TreeNode(children[i], i));
        child.parent = node;
      }
    }
  }

  (tree.parent = new TreeNode(null, 0)).children = [tree];
  return tree;
}

// Node-link tree diagram using the Reingold-Tilford "tidy" algorithm
function tree() {
  var separation = defaultSeparation,
      dx = 1,
      dy = 1,
      nodeSize = null;

  function tree(root) {
    var t = treeRoot(root);

    // Compute the layout using Buchheim et al.’s algorithm.
    t.eachAfter(firstWalk), t.parent.m = -t.z;
    t.eachBefore(secondWalk);

    // If a fixed node size is specified, scale x and y.
    if (nodeSize) root.eachBefore(sizeNode);

    // If a fixed tree size is specified, scale x and y based on the extent.
    // Compute the left-most, right-most, and depth-most nodes for extents.
    else {
      var left = root,
          right = root,
          bottom = root;
      root.eachBefore(function(node) {
        if (node.x < left.x) left = node;
        if (node.x > right.x) right = node;
        if (node.depth > bottom.depth) bottom = node;
      });
      var s = left === right ? 1 : separation(left, right) / 2,
          tx = s - left.x,
          kx = dx / (right.x + s + tx),
          ky = dy / (bottom.depth || 1);
      root.eachBefore(function(node) {
        node.x = (node.x + tx) * kx;
        node.y = node.depth * ky;
      });
    }

    return root;
  }

  // Computes a preliminary x-coordinate for v. Before that, FIRST WALK is
  // applied recursively to the children of v, as well as the function
  // APPORTION. After spacing out the children by calling EXECUTE SHIFTS, the
  // node v is placed to the midpoint of its outermost children.
  function firstWalk(v) {
    var children = v.children,
        siblings = v.parent.children,
        w = v.i ? siblings[v.i - 1] : null;
    if (children) {
      executeShifts(v);
      var midpoint = (children[0].z + children[children.length - 1].z) / 2;
      if (w) {
        v.z = w.z + separation(v._, w._);
        v.m = v.z - midpoint;
      } else {
        v.z = midpoint;
      }
    } else if (w) {
      v.z = w.z + separation(v._, w._);
    }
    v.parent.A = apportion(v, w, v.parent.A || siblings[0]);
  }

  // Computes all real x-coordinates by summing up the modifiers recursively.
  function secondWalk(v) {
    v._.x = v.z + v.parent.m;
    v.m += v.parent.m;
  }

  // The core of the algorithm. Here, a new subtree is combined with the
  // previous subtrees. Threads are used to traverse the inside and outside
  // contours of the left and right subtree up to the highest common level. The
  // vertices used for the traversals are vi+, vi-, vo-, and vo+, where the
  // superscript o means outside and i means inside, the subscript - means left
  // subtree and + means right subtree. For summing up the modifiers along the
  // contour, we use respective variables si+, si-, so-, and so+. Whenever two
  // nodes of the inside contours conflict, we compute the left one of the
  // greatest uncommon ancestors using the function ANCESTOR and call MOVE
  // SUBTREE to shift the subtree and prepare the shifts of smaller subtrees.
  // Finally, we add a new thread (if necessary).
  function apportion(v, w, ancestor) {
    if (w) {
      var vip = v,
          vop = v,
          vim = w,
          vom = vip.parent.children[0],
          sip = vip.m,
          sop = vop.m,
          sim = vim.m,
          som = vom.m,
          shift;
      while (vim = nextRight(vim), vip = nextLeft(vip), vim && vip) {
        vom = nextLeft(vom);
        vop = nextRight(vop);
        vop.a = v;
        shift = vim.z + sim - vip.z - sip + separation(vim._, vip._);
        if (shift > 0) {
          moveSubtree(nextAncestor(vim, v, ancestor), v, shift);
          sip += shift;
          sop += shift;
        }
        sim += vim.m;
        sip += vip.m;
        som += vom.m;
        sop += vop.m;
      }
      if (vim && !nextRight(vop)) {
        vop.t = vim;
        vop.m += sim - sop;
      }
      if (vip && !nextLeft(vom)) {
        vom.t = vip;
        vom.m += sip - som;
        ancestor = v;
      }
    }
    return ancestor;
  }

  function sizeNode(node) {
    node.x *= dx;
    node.y = node.depth * dy;
  }

  tree.separation = function(x) {
    return arguments.length ? (separation = x, tree) : separation;
  };

  tree.size = function(x) {
    return arguments.length ? (nodeSize = false, dx = +x[0], dy = +x[1], tree) : (nodeSize ? null : [dx, dy]);
  };

  tree.nodeSize = function(x) {
    return arguments.length ? (nodeSize = true, dx = +x[0], dy = +x[1], tree) : (nodeSize ? [dx, dy] : null);
  };

  return tree;
}

function constant$1(x) {
  return function constant() {
    return x;
  };
}

const abs = Math.abs;
const atan2 = Math.atan2;
const cos = Math.cos;
const max = Math.max;
const min = Math.min;
const sin = Math.sin;
const sqrt = Math.sqrt;

const epsilon = 1e-12;
const pi = Math.PI;
const halfPi = pi / 2;
const tau = 2 * pi;

function acos(x) {
  return x > 1 ? 0 : x < -1 ? pi : Math.acos(x);
}

function asin(x) {
  return x >= 1 ? halfPi : x <= -1 ? -halfPi : Math.asin(x);
}

function withPath(shape) {
  let digits = 3;

  shape.digits = function(_) {
    if (!arguments.length) return digits;
    if (_ == null) {
      digits = null;
    } else {
      const d = Math.floor(_);
      if (!(d >= 0)) throw new RangeError(`invalid digits: ${_}`);
      digits = d;
    }
    return shape;
  };

  return () => new Path(digits);
}

function arcInnerRadius(d) {
  return d.innerRadius;
}

function arcOuterRadius(d) {
  return d.outerRadius;
}

function arcStartAngle(d) {
  return d.startAngle;
}

function arcEndAngle(d) {
  return d.endAngle;
}

function arcPadAngle(d) {
  return d && d.padAngle; // Note: optional!
}

function intersect(x0, y0, x1, y1, x2, y2, x3, y3) {
  var x10 = x1 - x0, y10 = y1 - y0,
      x32 = x3 - x2, y32 = y3 - y2,
      t = y32 * x10 - x32 * y10;
  if (t * t < epsilon) return;
  t = (x32 * (y0 - y2) - y32 * (x0 - x2)) / t;
  return [x0 + t * x10, y0 + t * y10];
}

// Compute perpendicular offset line of length rc.
// http://mathworld.wolfram.com/Circle-LineIntersection.html
function cornerTangents(x0, y0, x1, y1, r1, rc, cw) {
  var x01 = x0 - x1,
      y01 = y0 - y1,
      lo = (cw ? rc : -rc) / sqrt(x01 * x01 + y01 * y01),
      ox = lo * y01,
      oy = -lo * x01,
      x11 = x0 + ox,
      y11 = y0 + oy,
      x10 = x1 + ox,
      y10 = y1 + oy,
      x00 = (x11 + x10) / 2,
      y00 = (y11 + y10) / 2,
      dx = x10 - x11,
      dy = y10 - y11,
      d2 = dx * dx + dy * dy,
      r = r1 - rc,
      D = x11 * y10 - x10 * y11,
      d = (dy < 0 ? -1 : 1) * sqrt(max(0, r * r * d2 - D * D)),
      cx0 = (D * dy - dx * d) / d2,
      cy0 = (-D * dx - dy * d) / d2,
      cx1 = (D * dy + dx * d) / d2,
      cy1 = (-D * dx + dy * d) / d2,
      dx0 = cx0 - x00,
      dy0 = cy0 - y00,
      dx1 = cx1 - x00,
      dy1 = cy1 - y00;

  // Pick the closer of the two intersection points.
  // TODO Is there a faster way to determine which intersection to use?
  if (dx0 * dx0 + dy0 * dy0 > dx1 * dx1 + dy1 * dy1) cx0 = cx1, cy0 = cy1;

  return {
    cx: cx0,
    cy: cy0,
    x01: -ox,
    y01: -oy,
    x11: cx0 * (r1 / r - 1),
    y11: cy0 * (r1 / r - 1)
  };
}

function arc() {
  var innerRadius = arcInnerRadius,
      outerRadius = arcOuterRadius,
      cornerRadius = constant$1(0),
      padRadius = null,
      startAngle = arcStartAngle,
      endAngle = arcEndAngle,
      padAngle = arcPadAngle,
      context = null,
      path = withPath(arc);

  function arc() {
    var buffer,
        r,
        r0 = +innerRadius.apply(this, arguments),
        r1 = +outerRadius.apply(this, arguments),
        a0 = startAngle.apply(this, arguments) - halfPi,
        a1 = endAngle.apply(this, arguments) - halfPi,
        da = abs(a1 - a0),
        cw = a1 > a0;

    if (!context) context = buffer = path();

    // Ensure that the outer radius is always larger than the inner radius.
    if (r1 < r0) r = r1, r1 = r0, r0 = r;

    // Is it a point?
    if (!(r1 > epsilon)) context.moveTo(0, 0);

    // Or is it a circle or annulus?
    else if (da > tau - epsilon) {
      context.moveTo(r1 * cos(a0), r1 * sin(a0));
      context.arc(0, 0, r1, a0, a1, !cw);
      if (r0 > epsilon) {
        context.moveTo(r0 * cos(a1), r0 * sin(a1));
        context.arc(0, 0, r0, a1, a0, cw);
      }
    }

    // Or is it a circular or annular sector?
    else {
      var a01 = a0,
          a11 = a1,
          a00 = a0,
          a10 = a1,
          da0 = da,
          da1 = da,
          ap = padAngle.apply(this, arguments) / 2,
          rp = (ap > epsilon) && (padRadius ? +padRadius.apply(this, arguments) : sqrt(r0 * r0 + r1 * r1)),
          rc = min(abs(r1 - r0) / 2, +cornerRadius.apply(this, arguments)),
          rc0 = rc,
          rc1 = rc,
          t0,
          t1;

      // Apply padding? Note that since r1 ≥ r0, da1 ≥ da0.
      if (rp > epsilon) {
        var p0 = asin(rp / r0 * sin(ap)),
            p1 = asin(rp / r1 * sin(ap));
        if ((da0 -= p0 * 2) > epsilon) p0 *= (cw ? 1 : -1), a00 += p0, a10 -= p0;
        else da0 = 0, a00 = a10 = (a0 + a1) / 2;
        if ((da1 -= p1 * 2) > epsilon) p1 *= (cw ? 1 : -1), a01 += p1, a11 -= p1;
        else da1 = 0, a01 = a11 = (a0 + a1) / 2;
      }

      var x01 = r1 * cos(a01),
          y01 = r1 * sin(a01),
          x10 = r0 * cos(a10),
          y10 = r0 * sin(a10);

      // Apply rounded corners?
      if (rc > epsilon) {
        var x11 = r1 * cos(a11),
            y11 = r1 * sin(a11),
            x00 = r0 * cos(a00),
            y00 = r0 * sin(a00),
            oc;

        // Restrict the corner radius according to the sector angle. If this
        // intersection fails, it’s probably because the arc is too small, so
        // disable the corner radius entirely.
        if (da < pi) {
          if (oc = intersect(x01, y01, x00, y00, x11, y11, x10, y10)) {
            var ax = x01 - oc[0],
                ay = y01 - oc[1],
                bx = x11 - oc[0],
                by = y11 - oc[1],
                kc = 1 / sin(acos((ax * bx + ay * by) / (sqrt(ax * ax + ay * ay) * sqrt(bx * bx + by * by))) / 2),
                lc = sqrt(oc[0] * oc[0] + oc[1] * oc[1]);
            rc0 = min(rc, (r0 - lc) / (kc - 1));
            rc1 = min(rc, (r1 - lc) / (kc + 1));
          } else {
            rc0 = rc1 = 0;
          }
        }
      }

      // Is the sector collapsed to a line?
      if (!(da1 > epsilon)) context.moveTo(x01, y01);

      // Does the sector’s outer ring have rounded corners?
      else if (rc1 > epsilon) {
        t0 = cornerTangents(x00, y00, x01, y01, r1, rc1, cw);
        t1 = cornerTangents(x11, y11, x10, y10, r1, rc1, cw);

        context.moveTo(t0.cx + t0.x01, t0.cy + t0.y01);

        // Have the corners merged?
        if (rc1 < rc) context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

        // Otherwise, draw the two corners and the ring.
        else {
          context.arc(t0.cx, t0.cy, rc1, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
          context.arc(0, 0, r1, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), !cw);
          context.arc(t1.cx, t1.cy, rc1, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
        }
      }

      // Or is the outer ring just a circular arc?
      else context.moveTo(x01, y01), context.arc(0, 0, r1, a01, a11, !cw);

      // Is there no inner ring, and it’s a circular sector?
      // Or perhaps it’s an annular sector collapsed due to padding?
      if (!(r0 > epsilon) || !(da0 > epsilon)) context.lineTo(x10, y10);

      // Does the sector’s inner ring (or point) have rounded corners?
      else if (rc0 > epsilon) {
        t0 = cornerTangents(x10, y10, x11, y11, r0, -rc0, cw);
        t1 = cornerTangents(x01, y01, x00, y00, r0, -rc0, cw);

        context.lineTo(t0.cx + t0.x01, t0.cy + t0.y01);

        // Have the corners merged?
        if (rc0 < rc) context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t1.y01, t1.x01), !cw);

        // Otherwise, draw the two corners and the ring.
        else {
          context.arc(t0.cx, t0.cy, rc0, atan2(t0.y01, t0.x01), atan2(t0.y11, t0.x11), !cw);
          context.arc(0, 0, r0, atan2(t0.cy + t0.y11, t0.cx + t0.x11), atan2(t1.cy + t1.y11, t1.cx + t1.x11), cw);
          context.arc(t1.cx, t1.cy, rc0, atan2(t1.y11, t1.x11), atan2(t1.y01, t1.x01), !cw);
        }
      }

      // Or is the inner ring just a circular arc?
      else context.arc(0, 0, r0, a10, a00, cw);
    }

    context.closePath();

    if (buffer) return context = null, buffer + "" || null;
  }

  arc.centroid = function() {
    var r = (+innerRadius.apply(this, arguments) + +outerRadius.apply(this, arguments)) / 2,
        a = (+startAngle.apply(this, arguments) + +endAngle.apply(this, arguments)) / 2 - pi / 2;
    return [cos(a) * r, sin(a) * r];
  };

  arc.innerRadius = function(_) {
    return arguments.length ? (innerRadius = typeof _ === "function" ? _ : constant$1(+_), arc) : innerRadius;
  };

  arc.outerRadius = function(_) {
    return arguments.length ? (outerRadius = typeof _ === "function" ? _ : constant$1(+_), arc) : outerRadius;
  };

  arc.cornerRadius = function(_) {
    return arguments.length ? (cornerRadius = typeof _ === "function" ? _ : constant$1(+_), arc) : cornerRadius;
  };

  arc.padRadius = function(_) {
    return arguments.length ? (padRadius = _ == null ? null : typeof _ === "function" ? _ : constant$1(+_), arc) : padRadius;
  };

  arc.startAngle = function(_) {
    return arguments.length ? (startAngle = typeof _ === "function" ? _ : constant$1(+_), arc) : startAngle;
  };

  arc.endAngle = function(_) {
    return arguments.length ? (endAngle = typeof _ === "function" ? _ : constant$1(+_), arc) : endAngle;
  };

  arc.padAngle = function(_) {
    return arguments.length ? (padAngle = typeof _ === "function" ? _ : constant$1(+_), arc) : padAngle;
  };

  arc.context = function(_) {
    return arguments.length ? ((context = _ == null ? null : _), arc) : context;
  };

  return arc;
}

var constant = x => () => x;

function ZoomEvent(type, {
  sourceEvent,
  target,
  transform,
  dispatch
}) {
  Object.defineProperties(this, {
    type: {value: type, enumerable: true, configurable: true},
    sourceEvent: {value: sourceEvent, enumerable: true, configurable: true},
    target: {value: target, enumerable: true, configurable: true},
    transform: {value: transform, enumerable: true, configurable: true},
    _: {value: dispatch}
  });
}

function Transform(k, x, y) {
  this.k = k;
  this.x = x;
  this.y = y;
}

Transform.prototype = {
  constructor: Transform,
  scale: function(k) {
    return k === 1 ? this : new Transform(this.k * k, this.x, this.y);
  },
  translate: function(x, y) {
    return x === 0 & y === 0 ? this : new Transform(this.k, this.x + this.k * x, this.y + this.k * y);
  },
  apply: function(point) {
    return [point[0] * this.k + this.x, point[1] * this.k + this.y];
  },
  applyX: function(x) {
    return x * this.k + this.x;
  },
  applyY: function(y) {
    return y * this.k + this.y;
  },
  invert: function(location) {
    return [(location[0] - this.x) / this.k, (location[1] - this.y) / this.k];
  },
  invertX: function(x) {
    return (x - this.x) / this.k;
  },
  invertY: function(y) {
    return (y - this.y) / this.k;
  },
  rescaleX: function(x) {
    return x.copy().domain(x.range().map(this.invertX, this).map(x.invert, x));
  },
  rescaleY: function(y) {
    return y.copy().domain(y.range().map(this.invertY, this).map(y.invert, y));
  },
  toString: function() {
    return "translate(" + this.x + "," + this.y + ") scale(" + this.k + ")";
  }
};

var identity = new Transform(1, 0, 0);

Transform.prototype;

function nopropagation(event) {
  event.stopImmediatePropagation();
}

function noevent(event) {
  event.preventDefault();
  event.stopImmediatePropagation();
}

// Ignore right-click, since that should open the context menu.
// except for pinch-to-zoom, which is sent as a wheel+ctrlKey event
function defaultFilter(event) {
  return (!event.ctrlKey || event.type === 'wheel') && !event.button;
}

function defaultExtent() {
  var e = this;
  if (e instanceof SVGElement) {
    e = e.ownerSVGElement || e;
    if (e.hasAttribute("viewBox")) {
      e = e.viewBox.baseVal;
      return [[e.x, e.y], [e.x + e.width, e.y + e.height]];
    }
    return [[0, 0], [e.width.baseVal.value, e.height.baseVal.value]];
  }
  return [[0, 0], [e.clientWidth, e.clientHeight]];
}

function defaultTransform() {
  return this.__zoom || identity;
}

function defaultWheelDelta(event) {
  return -event.deltaY * (event.deltaMode === 1 ? 0.05 : event.deltaMode ? 1 : 0.002) * (event.ctrlKey ? 10 : 1);
}

function defaultTouchable() {
  return navigator.maxTouchPoints || ("ontouchstart" in this);
}

function defaultConstrain(transform, extent, translateExtent) {
  var dx0 = transform.invertX(extent[0][0]) - translateExtent[0][0],
      dx1 = transform.invertX(extent[1][0]) - translateExtent[1][0],
      dy0 = transform.invertY(extent[0][1]) - translateExtent[0][1],
      dy1 = transform.invertY(extent[1][1]) - translateExtent[1][1];
  return transform.translate(
    dx1 > dx0 ? (dx0 + dx1) / 2 : Math.min(0, dx0) || Math.max(0, dx1),
    dy1 > dy0 ? (dy0 + dy1) / 2 : Math.min(0, dy0) || Math.max(0, dy1)
  );
}

function zoom() {
  var filter = defaultFilter,
      extent = defaultExtent,
      constrain = defaultConstrain,
      wheelDelta = defaultWheelDelta,
      touchable = defaultTouchable,
      scaleExtent = [0, Infinity],
      translateExtent = [[-Infinity, -Infinity], [Infinity, Infinity]],
      duration = 250,
      interpolate = interpolateZoom,
      listeners = dispatch("start", "zoom", "end"),
      touchstarting,
      touchfirst,
      touchending,
      touchDelay = 500,
      wheelDelay = 150,
      clickDistance2 = 0,
      tapDistance = 10;

  function zoom(selection) {
    selection
        .property("__zoom", defaultTransform)
        .on("wheel.zoom", wheeled, {passive: false})
        .on("mousedown.zoom", mousedowned)
        .on("dblclick.zoom", dblclicked)
      .filter(touchable)
        .on("touchstart.zoom", touchstarted)
        .on("touchmove.zoom", touchmoved)
        .on("touchend.zoom touchcancel.zoom", touchended)
        .style("-webkit-tap-highlight-color", "rgba(0,0,0,0)");
  }

  zoom.transform = function(collection, transform, point, event) {
    var selection = collection.selection ? collection.selection() : collection;
    selection.property("__zoom", defaultTransform);
    if (collection !== selection) {
      schedule(collection, transform, point, event);
    } else {
      selection.interrupt().each(function() {
        gesture(this, arguments)
          .event(event)
          .start()
          .zoom(null, typeof transform === "function" ? transform.apply(this, arguments) : transform)
          .end();
      });
    }
  };

  zoom.scaleBy = function(selection, k, p, event) {
    zoom.scaleTo(selection, function() {
      var k0 = this.__zoom.k,
          k1 = typeof k === "function" ? k.apply(this, arguments) : k;
      return k0 * k1;
    }, p, event);
  };

  zoom.scaleTo = function(selection, k, p, event) {
    zoom.transform(selection, function() {
      var e = extent.apply(this, arguments),
          t0 = this.__zoom,
          p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p,
          p1 = t0.invert(p0),
          k1 = typeof k === "function" ? k.apply(this, arguments) : k;
      return constrain(translate(scale(t0, k1), p0, p1), e, translateExtent);
    }, p, event);
  };

  zoom.translateBy = function(selection, x, y, event) {
    zoom.transform(selection, function() {
      return constrain(this.__zoom.translate(
        typeof x === "function" ? x.apply(this, arguments) : x,
        typeof y === "function" ? y.apply(this, arguments) : y
      ), extent.apply(this, arguments), translateExtent);
    }, null, event);
  };

  zoom.translateTo = function(selection, x, y, p, event) {
    zoom.transform(selection, function() {
      var e = extent.apply(this, arguments),
          t = this.__zoom,
          p0 = p == null ? centroid(e) : typeof p === "function" ? p.apply(this, arguments) : p;
      return constrain(identity.translate(p0[0], p0[1]).scale(t.k).translate(
        typeof x === "function" ? -x.apply(this, arguments) : -x,
        typeof y === "function" ? -y.apply(this, arguments) : -y
      ), e, translateExtent);
    }, p, event);
  };

  function scale(transform, k) {
    k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], k));
    return k === transform.k ? transform : new Transform(k, transform.x, transform.y);
  }

  function translate(transform, p0, p1) {
    var x = p0[0] - p1[0] * transform.k, y = p0[1] - p1[1] * transform.k;
    return x === transform.x && y === transform.y ? transform : new Transform(transform.k, x, y);
  }

  function centroid(extent) {
    return [(+extent[0][0] + +extent[1][0]) / 2, (+extent[0][1] + +extent[1][1]) / 2];
  }

  function schedule(transition, transform, point, event) {
    transition
        .on("start.zoom", function() { gesture(this, arguments).event(event).start(); })
        .on("interrupt.zoom end.zoom", function() { gesture(this, arguments).event(event).end(); })
        .tween("zoom", function() {
          var that = this,
              args = arguments,
              g = gesture(that, args).event(event),
              e = extent.apply(that, args),
              p = point == null ? centroid(e) : typeof point === "function" ? point.apply(that, args) : point,
              w = Math.max(e[1][0] - e[0][0], e[1][1] - e[0][1]),
              a = that.__zoom,
              b = typeof transform === "function" ? transform.apply(that, args) : transform,
              i = interpolate(a.invert(p).concat(w / a.k), b.invert(p).concat(w / b.k));
          return function(t) {
            if (t === 1) t = b; // Avoid rounding error on end.
            else { var l = i(t), k = w / l[2]; t = new Transform(k, p[0] - l[0] * k, p[1] - l[1] * k); }
            g.zoom(null, t);
          };
        });
  }

  function gesture(that, args, clean) {
    return (!clean && that.__zooming) || new Gesture(that, args);
  }

  function Gesture(that, args) {
    this.that = that;
    this.args = args;
    this.active = 0;
    this.sourceEvent = null;
    this.extent = extent.apply(that, args);
    this.taps = 0;
  }

  Gesture.prototype = {
    event: function(event) {
      if (event) this.sourceEvent = event;
      return this;
    },
    start: function() {
      if (++this.active === 1) {
        this.that.__zooming = this;
        this.emit("start");
      }
      return this;
    },
    zoom: function(key, transform) {
      if (this.mouse && key !== "mouse") this.mouse[1] = transform.invert(this.mouse[0]);
      if (this.touch0 && key !== "touch") this.touch0[1] = transform.invert(this.touch0[0]);
      if (this.touch1 && key !== "touch") this.touch1[1] = transform.invert(this.touch1[0]);
      this.that.__zoom = transform;
      this.emit("zoom");
      return this;
    },
    end: function() {
      if (--this.active === 0) {
        delete this.that.__zooming;
        this.emit("end");
      }
      return this;
    },
    emit: function(type) {
      var d = select(this.that).datum();
      listeners.call(
        type,
        this.that,
        new ZoomEvent(type, {
          sourceEvent: this.sourceEvent,
          target: zoom,
          type,
          transform: this.that.__zoom,
          dispatch: listeners
        }),
        d
      );
    }
  };

  function wheeled(event, ...args) {
    if (!filter.apply(this, arguments)) return;
    var g = gesture(this, args).event(event),
        t = this.__zoom,
        k = Math.max(scaleExtent[0], Math.min(scaleExtent[1], t.k * Math.pow(2, wheelDelta.apply(this, arguments)))),
        p = pointer(event);

    // If the mouse is in the same location as before, reuse it.
    // If there were recent wheel events, reset the wheel idle timeout.
    if (g.wheel) {
      if (g.mouse[0][0] !== p[0] || g.mouse[0][1] !== p[1]) {
        g.mouse[1] = t.invert(g.mouse[0] = p);
      }
      clearTimeout(g.wheel);
    }

    // If this wheel event won’t trigger a transform change, ignore it.
    else if (t.k === k) return;

    // Otherwise, capture the mouse point and location at the start.
    else {
      g.mouse = [p, t.invert(p)];
      interrupt(this);
      g.start();
    }

    noevent(event);
    g.wheel = setTimeout(wheelidled, wheelDelay);
    g.zoom("mouse", constrain(translate(scale(t, k), g.mouse[0], g.mouse[1]), g.extent, translateExtent));

    function wheelidled() {
      g.wheel = null;
      g.end();
    }
  }

  function mousedowned(event, ...args) {
    if (touchending || !filter.apply(this, arguments)) return;
    var currentTarget = event.currentTarget,
        g = gesture(this, args, true).event(event),
        v = select(event.view).on("mousemove.zoom", mousemoved, true).on("mouseup.zoom", mouseupped, true),
        p = pointer(event, currentTarget),
        x0 = event.clientX,
        y0 = event.clientY;

    dragDisable(event.view);
    nopropagation(event);
    g.mouse = [p, this.__zoom.invert(p)];
    interrupt(this);
    g.start();

    function mousemoved(event) {
      noevent(event);
      if (!g.moved) {
        var dx = event.clientX - x0, dy = event.clientY - y0;
        g.moved = dx * dx + dy * dy > clickDistance2;
      }
      g.event(event)
       .zoom("mouse", constrain(translate(g.that.__zoom, g.mouse[0] = pointer(event, currentTarget), g.mouse[1]), g.extent, translateExtent));
    }

    function mouseupped(event) {
      v.on("mousemove.zoom mouseup.zoom", null);
      yesdrag(event.view, g.moved);
      noevent(event);
      g.event(event).end();
    }
  }

  function dblclicked(event, ...args) {
    if (!filter.apply(this, arguments)) return;
    var t0 = this.__zoom,
        p0 = pointer(event.changedTouches ? event.changedTouches[0] : event, this),
        p1 = t0.invert(p0),
        k1 = t0.k * (event.shiftKey ? 0.5 : 2),
        t1 = constrain(translate(scale(t0, k1), p0, p1), extent.apply(this, args), translateExtent);

    noevent(event);
    if (duration > 0) select(this).transition().duration(duration).call(schedule, t1, p0, event);
    else select(this).call(zoom.transform, t1, p0, event);
  }

  function touchstarted(event, ...args) {
    if (!filter.apply(this, arguments)) return;
    var touches = event.touches,
        n = touches.length,
        g = gesture(this, args, event.changedTouches.length === n).event(event),
        started, i, t, p;

    nopropagation(event);
    for (i = 0; i < n; ++i) {
      t = touches[i], p = pointer(t, this);
      p = [p, this.__zoom.invert(p), t.identifier];
      if (!g.touch0) g.touch0 = p, started = true, g.taps = 1 + !!touchstarting;
      else if (!g.touch1 && g.touch0[2] !== p[2]) g.touch1 = p, g.taps = 0;
    }

    if (touchstarting) touchstarting = clearTimeout(touchstarting);

    if (started) {
      if (g.taps < 2) touchfirst = p[0], touchstarting = setTimeout(function() { touchstarting = null; }, touchDelay);
      interrupt(this);
      g.start();
    }
  }

  function touchmoved(event, ...args) {
    if (!this.__zooming) return;
    var g = gesture(this, args).event(event),
        touches = event.changedTouches,
        n = touches.length, i, t, p, l;

    noevent(event);
    for (i = 0; i < n; ++i) {
      t = touches[i], p = pointer(t, this);
      if (g.touch0 && g.touch0[2] === t.identifier) g.touch0[0] = p;
      else if (g.touch1 && g.touch1[2] === t.identifier) g.touch1[0] = p;
    }
    t = g.that.__zoom;
    if (g.touch1) {
      var p0 = g.touch0[0], l0 = g.touch0[1],
          p1 = g.touch1[0], l1 = g.touch1[1],
          dp = (dp = p1[0] - p0[0]) * dp + (dp = p1[1] - p0[1]) * dp,
          dl = (dl = l1[0] - l0[0]) * dl + (dl = l1[1] - l0[1]) * dl;
      t = scale(t, Math.sqrt(dp / dl));
      p = [(p0[0] + p1[0]) / 2, (p0[1] + p1[1]) / 2];
      l = [(l0[0] + l1[0]) / 2, (l0[1] + l1[1]) / 2];
    }
    else if (g.touch0) p = g.touch0[0], l = g.touch0[1];
    else return;

    g.zoom("touch", constrain(translate(t, p, l), g.extent, translateExtent));
  }

  function touchended(event, ...args) {
    if (!this.__zooming) return;
    var g = gesture(this, args).event(event),
        touches = event.changedTouches,
        n = touches.length, i, t;

    nopropagation(event);
    if (touchending) clearTimeout(touchending);
    touchending = setTimeout(function() { touchending = null; }, touchDelay);
    for (i = 0; i < n; ++i) {
      t = touches[i];
      if (g.touch0 && g.touch0[2] === t.identifier) delete g.touch0;
      else if (g.touch1 && g.touch1[2] === t.identifier) delete g.touch1;
    }
    if (g.touch1 && !g.touch0) g.touch0 = g.touch1, delete g.touch1;
    if (g.touch0) g.touch0[1] = this.__zoom.invert(g.touch0[0]);
    else {
      g.end();
      // If this was a dbltap, reroute to the (optional) dblclick.zoom handler.
      if (g.taps === 2) {
        t = pointer(t, this);
        if (Math.hypot(touchfirst[0] - t[0], touchfirst[1] - t[1]) < tapDistance) {
          var p = select(this).on("dblclick.zoom");
          if (p) p.apply(this, arguments);
        }
      }
    }
  }

  zoom.wheelDelta = function(_) {
    return arguments.length ? (wheelDelta = typeof _ === "function" ? _ : constant(+_), zoom) : wheelDelta;
  };

  zoom.filter = function(_) {
    return arguments.length ? (filter = typeof _ === "function" ? _ : constant(!!_), zoom) : filter;
  };

  zoom.touchable = function(_) {
    return arguments.length ? (touchable = typeof _ === "function" ? _ : constant(!!_), zoom) : touchable;
  };

  zoom.extent = function(_) {
    return arguments.length ? (extent = typeof _ === "function" ? _ : constant([[+_[0][0], +_[0][1]], [+_[1][0], +_[1][1]]]), zoom) : extent;
  };

  zoom.scaleExtent = function(_) {
    return arguments.length ? (scaleExtent[0] = +_[0], scaleExtent[1] = +_[1], zoom) : [scaleExtent[0], scaleExtent[1]];
  };

  zoom.translateExtent = function(_) {
    return arguments.length ? (translateExtent[0][0] = +_[0][0], translateExtent[1][0] = +_[1][0], translateExtent[0][1] = +_[0][1], translateExtent[1][1] = +_[1][1], zoom) : [[translateExtent[0][0], translateExtent[0][1]], [translateExtent[1][0], translateExtent[1][1]]];
  };

  zoom.constrain = function(_) {
    return arguments.length ? (constrain = _, zoom) : constrain;
  };

  zoom.duration = function(_) {
    return arguments.length ? (duration = +_, zoom) : duration;
  };

  zoom.interpolate = function(_) {
    return arguments.length ? (interpolate = _, zoom) : interpolate;
  };

  zoom.on = function() {
    var value = listeners.on.apply(listeners, arguments);
    return value === listeners ? zoom : value;
  };

  zoom.clickDistance = function(_) {
    return arguments.length ? (clickDistance2 = (_ = +_) * _, zoom) : Math.sqrt(clickDistance2);
  };

  zoom.tapDistance = function(_) {
    return arguments.length ? (tapDistance = +_, zoom) : tapDistance;
  };

  return zoom;
}

var convertToD3Format = function (node) {
    if (!node)
        return null;
    return {
        name: node.name || '',
        value: node.length || 0,
        children: node.branchset
            ? node.branchset.map(function (child) { return convertToD3Format(child); })
                .filter(function (node) { return node !== null; })
            : [],
    };
};
var radialToD3Node = function (node) {
    return {
        name: node.data.name,
        value: node.data.value,
        children: node.children ? node.children.map(function (child) { return radialToD3Node(child); }) : [],
    };
};
function readTree(text) {
    // remove whitespace
    text = text.replace(/\s+$/g, '') // Remove trailing whitespace
        .replace(/[\r\n]+/g, '') // Remove carriage returns and newlines
        .replace(/\s+/g, ''); // Remove any remaining whitespace
    var tokens = text.split(/(;|\(|\)|,)/), root = {
        parent: null,
        branchset: []
    }, curnode = root, nodeId = 0;
    for (var _i = 0, tokens_1 = tokens; _i < tokens_1.length; _i++) {
        var token = tokens_1[_i];
        if (token === "" || token === ';') {
            continue;
        }
        if (token === '(') {
            // add a child to current node
            var child = {
                parent: curnode,
                branchset: []
            };
            curnode.branchset.push(child);
            curnode = child; // climb up
        }
        else if (token === ',') {
            // climb down, add another child to parent
            if (curnode.parent) {
                curnode = curnode.parent;
            }
            else {
                throw new Error("Parent node is undefined");
            }
            var child = {
                'parent': curnode,
                'branchset': []
            };
            curnode.branchset.push(child);
            curnode = child; // climb up
        }
        else if (token === ')') {
            // climb down twice
            if (curnode.parent) {
                curnode = curnode.parent;
            }
            else {
                throw new Error("Parent node is undefined");
            }
            if (curnode === null) {
                break;
            }
        }
        else {
            var nodeinfo = token.split(':');
            if (nodeinfo.length === 1) {
                if (token.startsWith(':')) {
                    curnode.name = "";
                    curnode.length = parseFloat(nodeinfo[0]);
                }
                else {
                    curnode.name = nodeinfo[0];
                    curnode.length = undefined;
                }
            }
            else if (nodeinfo.length === 2) {
                curnode.name = nodeinfo[0];
                curnode.length = parseFloat(nodeinfo[1]);
            }
            else {
                // TODO: handle edge cases with >1 ":"
                console.warn(token, "I don't know what to do with two colons!");
            }
            curnode.id = nodeId++; // assign then increment
        }
    }
    curnode.id = nodeId;
    return (root);
}
function selectAllLeaves(node) {
    var leaves = [];
    function traverse(currentNode) {
        if (!currentNode.children || currentNode.children.length === 0) {
            leaves.push(currentNode);
        }
        else {
            currentNode.children.forEach(function (child) { return traverse(child); });
        }
    }
    traverse(node);
    return leaves;
}
function selectAllNodes(node) {
    var nodes = [];
    function traverse(currentNode) {
        nodes.push(currentNode);
        if (currentNode.children) {
            currentNode.children.forEach(function (child) { return traverse(child); });
        }
    }
    traverse(node);
    return nodes;
}

function getBoundingBox$1(node, isVariable) {
    var _a, _b, _c, _d;
    var bbox = {
        minX: (_a = node.x) !== null && _a !== void 0 ? _a : 0,
        maxX: (_b = node.x) !== null && _b !== void 0 ? _b : 0,
        minY: isVariable ? (_c = node.radius) !== null && _c !== void 0 ? _c : 0 : (_d = node.y) !== null && _d !== void 0 ? _d : 0,
    };
    if (node.children) {
        node.children.forEach(function (child) {
            var childBox = getBoundingBox$1(child, isVariable);
            bbox.minX = Math.min(bbox.minX, childBox.minX);
            bbox.maxX = Math.max(bbox.maxX, childBox.maxX);
            bbox.minY = Math.min(bbox.minY, childBox.minY);
        });
    }
    return bbox;
}
var countLeaves$1 = function (node) {
    if (!node.children || node.children.length === 0) {
        return 1;
    }
    return node.children.reduce(function (sum, child) { return sum + countLeaves$1(child); }, 0);
};
function highlightDescendantsRadial(node, active, linksVariable, svg, innerRadius) {
    var bbox = getBoundingBox$1(node, linksVariable);
    // Remove existing highlight
    svg.selectAll('.highlight-box').remove();
    if (active) {
        // Create highlight box
        svg.insert('path', ':first-child')
            .attr('class', 'highlight-box')
            .attr('d', arc()({
            innerRadius: bbox.minY,
            outerRadius: innerRadius + 170,
            startAngle: (bbox.minX) * (Math.PI / 180), // Angle in radians
            endAngle: (bbox.maxX) * (Math.PI / 180)
        }))
            .style('fill', 'rgba(255, 255, 0, 0.2)')
            .style('stroke', 'none');
    }
}
function colorDescendantsRadial(node, active, linksVariable, svg, innerRadius, color) {
    var bbox = getBoundingBox$1(node, linksVariable);
    console.log("coloring", node.data.name, color);
    //remove existing color box
    svg.selectAll(".color-box-".concat(node.data.name)).remove();
    if (active) {
        // Create color box
        var colorGroup = svg.select('g.color-boxes');
        if (colorGroup.empty()) {
            colorGroup = svg.insert('g', ':first-child')
                .attr('class', 'color-boxes')
                .style('isolation', 'isolate')
                .lower();
        }
        colorGroup.append('path')
            .attr('class', "color-box color-box-".concat(node.data.name))
            .attr('d', arc()({
            innerRadius: bbox.minY,
            outerRadius: innerRadius + 170,
            startAngle: (bbox.minX) * (Math.PI / 180), // Angle in radians
            endAngle: (bbox.maxX) * (Math.PI / 180)
        }))
            .style('fill', color)
            .style('composite-operation', 'source-over');
    }
}
function mapChildren$1(node, callback) {
    if (node.children) {
        node.children.forEach(function (child) {
            mapChildren$1(child, callback);
        });
    }
    callback(node);
}
function toggleHighlightDescendantLinks$1(node) {
    if (node.children) {
        node.children.forEach(function (child) {
            mapChildren$1(child, function (child) {
                if (child.linkNode) {
                    var isHighlighted = select(child.linkNode).classed('link--highlight');
                    select(child.linkNode).classed('link--highlight', !isHighlighted);
                }
            });
        });
    }
}
function toggleHighlightTerminalLinks$1(node) {
    // Recurse through all children and highlight links
    if (node.children) {
        node.children.forEach(function (child) {
            mapChildren$1(child, function (child) {
                if (!child.children && child.linkNode) {
                    var isHighlighted = select(child.linkNode).classed('link--highlight');
                    select(child.linkNode).classed('link--highlight', !isHighlighted);
                }
            });
        });
    }
}
function toggleHighlightLinkToRoot(node) {
    var current = node;
    do {
        if (current.linkNode) {
            var isHighlighted = select(current.linkNode).classed('link--highlight');
            select(current.linkNode)
                .classed('link--highlight', !isHighlighted)
                .raise();
        }
    } while (current.parent && (current = current.parent));
}
function toggleElementClass$1(element, className, active) {
    if (!element)
        return;
    select(element).classed(className, active);
}
function toggleCollapseClade$1(node) {
    if (node.nodeElement) {
        var isHidden_1 = select(node.nodeElement).select("circle").classed('node--collapsed');
        select(node.nodeElement).select("circle").classed('node--collapsed', !isHidden_1);
        if (node.children) {
            node.children.forEach(function (child) {
                mapChildren$1(child, function (child) {
                    toggleElementClass$1(child.linkNode, 'link--hidden', !isHidden_1);
                    toggleElementClass$1(child.nodeElement, 'link--hidden', !isHidden_1);
                    toggleElementClass$1(child.linkExtensionNode, 'link--hidden', !isHidden_1);
                    toggleElementClass$1(child.labelElement, 'link--hidden', !isHidden_1);
                    // Reset any collapsed nodes under this clade
                    if (child.nodeElement) {
                        select(child.nodeElement).select("circle").classed('node--collapsed', !isHidden_1);
                    }
                });
            });
        }
    }
}
function reroot(node, data) {
    // Already root
    if (!node.parent)
        return node;
    var tree$1 = tree();
    // BFS to find node.data.name in data
    var queue = [data];
    var found = false;
    var newRoot = data;
    while (queue.length > 0 && !found) {
        var current = queue.shift();
        if (current === null || current === void 0 ? void 0 : current.children) {
            for (var _i = 0, _a = current.children; _i < _a.length; _i++) {
                var child = _a[_i];
                if (child.data.name === node.data.name) { // found node
                    found = true;
                    // remove node from parent's children
                    var index = current.children.indexOf(child);
                    current.children.splice(index, 1);
                    newRoot = child;
                    // Start flipping process
                    var currentNode = child;
                    var parentNode = current;
                    while (parentNode) {
                        // Remove current from parent's children
                        if (parentNode.children) {
                            var index_1 = parentNode.children.indexOf(currentNode);
                            if (index_1 > -1) {
                                parentNode.children.splice(index_1, 1);
                            }
                        }
                        // Add parent to current's children
                        if (!currentNode.children) {
                            currentNode.children = [];
                        }
                        currentNode.children.push(parentNode);
                        // Move up tree
                        currentNode = parentNode;
                        parentNode = parentNode.parent || null;
                    }
                    return tree$1(hierarchy(radialToD3Node(newRoot)));
                }
            }
            queue.push.apply(queue, current.children);
        }
    }
    return node;
}
function findAndZoom$2(name, svg, container, variable) {
    var _a, _b, _c;
    // Find node with name in tree
    var node = svg.select('g.nodes')
        .selectAll('g.inner-node')
        .filter(function (d) { return d.data.name === name; });
    var leaf = svg.select('g.leaves')
        .selectAll('text.leaf-label')
        .filter(function (d) { return d.data.name === name; });
    if (!node.empty()) {
        var nodeElement = node.node();
        var nodeData = node.data()[0];
        var distance = variable ? ((_a = nodeData.radius) !== null && _a !== void 0 ? _a : 0) : ((_b = nodeData.y) !== null && _b !== void 0 ? _b : 0);
        var x = ((_c = nodeData.x) !== null && _c !== void 0 ? _c : 0) * Math.PI / 180; // Convert degrees to radians
        // Convert polar to cartesian coordinates
        var cartX = distance * Math.cos(x);
        var cartY = distance * Math.sin(x);
        var centerOffsetX = container.current.clientWidth / 2;
        var centerOffsetY = container.current.clientHeight / 2;
        var zoom$1 = zoom().on("zoom", function (event) {
            svg.select("g").attr("transform", event.transform);
        });
        svg.transition()
            .duration(750)
            .call(zoom$1.transform, identity
            .translate(-cartY + centerOffsetX, cartX + centerOffsetY)
            .scale(1));
        var circle = select(nodeElement).select('circle');
        var currRadius = circle.attr("r");
        var currColor = circle.style("fill");
        var newRadius = (parseFloat(currRadius) * 2).toString();
        circle.transition()
            .delay(1000)
            .style("fill", "red")
            .style("r", newRadius)
            .transition()
            .duration(750)
            .style("fill", currColor)
            .style("r", currRadius)
            .transition()
            .duration(750)
            .style("fill", "red")
            .style("r", newRadius)
            .transition()
            .duration(750)
            .style("fill", currColor)
            .style("r", currRadius);
    }
    else if (!leaf.empty()) {
        var leafElement = leaf.node();
        var leafData = leaf.data()[0];
        var path = leafData.linkExtensionNode;
        if (path) {
            var pathStrValue = path.getAttribute('d') || '';
            var lastLCoords = pathStrValue.match(/L\s*([0-9.-]+)\s*,?\s*([0-9.-]+)\s*$/);
            if (lastLCoords) {
                lastLCoords[0]; var x = lastLCoords[1], y = lastLCoords[2];
                // Center the node
                var centerOffestX = container.current.clientWidth / 2;
                var centerOffestY = container.current.clientHeight / 2;
                var zoom$1 = zoom().on("zoom", function (event) {
                    svg.select("g").attr("transform", event.transform);
                });
                // Apply transform here
                svg.transition()
                    .duration(750)
                    .call(zoom$1.transform, identity
                    .translate(-x + centerOffestX, -y + centerOffestY)
                    .scale(1));
                // Pulse the leaf label text
                var text = select(leafElement);
                var currColor = text.style("fill");
                var currSize = text.style("font-size");
                var newSize = (parseFloat(currSize) * 2).toString();
                text.transition()
                    .delay(750)
                    .style("fill", "red")
                    .style("font-size", newSize)
                    .transition()
                    .duration(750)
                    .style("fill", currColor)
                    .style("font-size", currSize)
                    .transition()
                    .duration(750)
                    .style("fill", "red")
                    .style("font-size", newSize)
                    .transition()
                    .duration(750)
                    .style("fill", currColor)
                    .style("font-size", currSize);
                // Pulse the link extension
                var linkExtension = select(path);
                var currStroke = linkExtension.style("stroke");
                var currStrokeWidth = linkExtension.style("stroke-width");
                var newStrokeWidth = (parseFloat(currStrokeWidth) * 2).toString();
                linkExtension.transition()
                    .delay(750)
                    .style("stroke", "red")
                    .style("stroke-width", newStrokeWidth)
                    .transition()
                    .duration(750)
                    .style("stroke", currStroke)
                    .style("stroke-width", currStrokeWidth)
                    .transition()
                    .duration(750)
                    .style("stroke", "red")
                    .style("stroke-width", newStrokeWidth)
                    .transition()
                    .duration(750)
                    .style("stroke", currStroke)
                    .style("stroke-width", currStrokeWidth);
            }
        }
    }
}

function getBoundingBox(node, isVariable) {
    var _a, _b, _c, _d;
    var bbox = {
        minX: (_a = node.x) !== null && _a !== void 0 ? _a : 0,
        maxX: (_b = node.x) !== null && _b !== void 0 ? _b : 0,
        minY: isVariable ? (_c = node.radius) !== null && _c !== void 0 ? _c : 0 : (_d = node.y) !== null && _d !== void 0 ? _d : 0,
    };
    if (node.children) {
        node.children.forEach(function (child) {
            var childBox = getBoundingBox(child, isVariable);
            bbox.minX = Math.min(bbox.minX, childBox.minX);
            bbox.maxX = Math.max(bbox.maxX, childBox.maxX);
            bbox.minY = Math.min(bbox.minY, childBox.minY);
        });
    }
    return bbox;
}
function highlightDescendantsRect(node, active, linksVariable, svg, innerRadius) {
    var bbox = getBoundingBox(node, linksVariable);
    // Remove existing highlight
    svg.selectAll('.highlight-box').remove();
    if (active) {
        // Create highlight box
        svg.insert('path', ':first-child')
            .attr('class', 'highlight-box')
            .attr('d', "M ".concat(bbox.minY, " ").concat(bbox.minX, " \n                L ").concat(innerRadius + 170, " ").concat(bbox.minX, " \n                L ").concat(innerRadius + 170, " ").concat(bbox.maxX, " \n                L ").concat(bbox.minY, " ").concat(bbox.maxX, " \n                Z"))
            .style('fill', 'rgba(255, 255, 0, 0.2)');
    }
}
function colorDescendantsRect(node, active, linksVariable, svg, innerRadius, color) {
    var bbox = getBoundingBox(node, linksVariable);
    //remove existing color box
    svg.selectAll(".color-box-".concat(node.data.name)).remove();
    if (active) {
        // Create highlight box
        var colorGroup = svg.select('g.color-boxes');
        if (colorGroup.empty()) {
            colorGroup = svg.insert('g', ':first-child')
                .attr('class', 'color-boxes')
                .style('isolation', 'isolate')
                .lower();
        }
        colorGroup.append('path')
            .attr('class', "color-box color-box-".concat(node.data.name))
            .attr('d', "M ".concat(bbox.minY, " ").concat(bbox.minX, " \n            L ").concat(innerRadius + 170, " ").concat(bbox.minX, " \n            L ").concat(innerRadius + 170, " ").concat(bbox.maxX, " \n            L ").concat(bbox.minY, " ").concat(bbox.maxX, " \n            Z"))
            .style('fill', color)
            .style('composite-operation', 'source-over');
    }
}
function findAndZoom$1(name, svg, container, variable) {
    var _a, _b, _c;
    var node = svg.select('g.nodes')
        .selectAll('g.inner-node')
        .filter(function (d) { return d.data.name === name; });
    var leaf = svg.select('g.leaves')
        .selectAll('text.leaf-label')
        .filter(function (d) { return d.data.name === name; });
    if (!node.empty()) {
        var nodeElement = node.node();
        var nodeData = node.data()[0];
        var x = (_a = nodeData.x) !== null && _a !== void 0 ? _a : 0;
        var y = variable ? ((_b = nodeData.radius) !== null && _b !== void 0 ? _b : 0) : ((_c = nodeData.y) !== null && _c !== void 0 ? _c : 0);
        var centerOffsetX = container.current.clientWidth / 2;
        var centerOffsetY = container.current.clientHeight / 2;
        var zoom$1 = zoom().on("zoom", function (event) {
            svg.select("g").attr("transform", event.transform);
        });
        svg.transition()
            .duration(750)
            .call(zoom$1.transform, identity
            .translate(-y + centerOffsetX, -x + centerOffsetY)
            .scale(1));
        var circle = select(nodeElement).select('circle');
        var currRadius = circle.attr("r");
        var currColor = circle.style("fill");
        var newRadius = (parseFloat(currRadius) * 2).toString();
        circle.transition()
            .delay(1000)
            .style("fill", "red")
            .style("r", newRadius)
            .transition()
            .duration(750)
            .style("fill", currColor)
            .style("r", currRadius)
            .transition()
            .duration(750)
            .style("fill", "red")
            .style("r", newRadius)
            .transition()
            .duration(750)
            .style("fill", currColor)
            .style("r", currRadius);
    }
    else if (!leaf.empty()) {
        var leafElement = leaf.node();
        var leafData = leaf.data()[0];
        var path = leafData.linkExtensionNode;
        if (path) {
            var pathStrValue = path.getAttribute('d') || '';
            var lastLCoords = pathStrValue.match(/V\s*([0-9.-]+)H\s*([0-9.-]+)/);
            if (lastLCoords) {
                lastLCoords[0]; var x = lastLCoords[1], y = lastLCoords[2];
                // Center the node
                var centerOffsetX = container.current.clientWidth / 2;
                var centerOffsetY = container.current.clientHeight / 2;
                var zoom$1 = zoom().on("zoom", function (event) {
                    svg.select("g").attr("transform", event.transform);
                });
                // Apply transform here
                svg.transition()
                    .duration(750)
                    .call(zoom$1.transform, identity
                    .translate(-y + centerOffsetX, -x + centerOffsetY)
                    .scale(1));
                // Pulse the leaf label text
                var text = select(leafElement);
                var currColor = text.style("fill");
                var currSize = text.style("font-size");
                var newSize = (parseFloat(currSize) * 2).toString();
                text.transition()
                    .delay(750)
                    .style("fill", "red")
                    .style("font-size", newSize)
                    .transition()
                    .duration(750)
                    .style("fill", currColor)
                    .style("font-size", currSize)
                    .transition()
                    .duration(750)
                    .style("fill", "red")
                    .style("font-size", newSize)
                    .transition()
                    .duration(750)
                    .style("fill", currColor)
                    .style("font-size", currSize);
                // Pulse the link extension
                var linkExtension = select(path);
                var currStroke = linkExtension.style("stroke");
                var currStrokeWidth = linkExtension.style("stroke-width");
                var newStrokeWidth = (parseFloat(currStrokeWidth) * 2).toString();
                linkExtension.transition()
                    .delay(750)
                    .style("stroke", "red")
                    .style("stroke-width", newStrokeWidth)
                    .transition()
                    .duration(750)
                    .style("stroke", currStroke)
                    .style("stroke-width", currStrokeWidth)
                    .transition()
                    .duration(750)
                    .style("stroke", "red")
                    .style("stroke-width", newStrokeWidth)
                    .transition()
                    .duration(750)
                    .style("stroke", currStroke)
                    .style("stroke-width", currStrokeWidth);
            }
        }
    }
}

function styleInject(css, ref) {
  if ( ref === void 0 ) ref = {};
  var insertAt = ref.insertAt;

  if (!css || typeof document === 'undefined') { return; }

  var head = document.head || document.getElementsByTagName('head')[0];
  var style = document.createElement('style');
  style.type = 'text/css';

  if (insertAt === 'top') {
    if (head.firstChild) {
      head.insertBefore(style, head.firstChild);
    } else {
      head.appendChild(style);
    }
  } else {
    head.appendChild(style);
  }

  if (style.styleSheet) {
    style.styleSheet.cssText = css;
  } else {
    style.appendChild(document.createTextNode(css));
  }
}

var css_248z$1 = ".menu-node {\r\n  background: white;\r\n  border: 1px solid #ccc;\r\n  border-radius: 4px;\r\n  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.2);\r\n  text-align: left;\r\n}\r\n\r\n.menu-buttons {\r\n  display: flex;\r\n  flex-direction: column;\r\n}\r\n\r\n.menu-btn {\r\n  padding: 4px 8px;\r\n  border: 1px solid #ddd;\r\n  border-radius: 3px;\r\n  background: #f5f5f5;\r\n  cursor: pointer;\r\n}\r\n\r\n.menu-btn:hover {\r\n  background: #e0e0e0;\r\n}\r\n\r\n.link--active {\r\n  stroke: #000 !important;\r\n  stroke-width: 2px;\r\n}\r\n\r\n.link--important {\r\n  stroke: #00F !important;\r\n  stroke-width: 1.5px;\r\n}\r\n\r\n.link-extension--active {\r\n  stroke-opacity: .6;\r\n}\r\n\r\n.label--active {\r\n  font-weight: bold;\r\n}\r\n\r\n.node--active {\r\n  stroke: #003366 !important;\r\n  fill: #0066cc !important;\r\n}\r\n\r\n.link--highlight {\r\n  stroke: #FF0000 !important;\r\n  stroke-width: 1.5px;\r\n}\r\n\r\n.link--hidden {\r\n  display: none;\r\n}\r\n\r\n.node--collapsed {\r\n  r: 4px !important;\r\n  fill: #0066cc !important;\r\n}\r\n\r\n.tooltip-node {\r\n  position: absolute;\r\n  background: white;\r\n  padding: 5px;\r\n  border: 1px solid #ccc;\r\n  border-radius: 4px;\r\n  font-size: 12px;\r\n  z-index: 10;\r\n}";
styleInject(css_248z$1);

var css_248z = ".dropdown-menu {\r\n  position: absolute;\r\n  top: 100%;\r\n  left: 0;\r\n  z-index: 1000;\r\n  display: none;\r\n  float: left;\r\n  min-width: 10rem;\r\n  padding: 0.5rem 0;\r\n  margin: 0.125rem 0 0;\r\n  font-size: 1rem;\r\n  color: #777;\r\n  text-align: left;\r\n  list-style: none;\r\n  background-color: #fff;\r\n  background-clip: padding-box;\r\n  border: 1px solid rgba(0, 0, 0, 0.15);\r\n  border-radius: 0.25rem;\r\n}\r\n\r\n.dropdown-item {\r\n  display: block;\r\n  padding: 0.25rem 1rem;\r\n  clear: both;\r\n  font-weight: 400;\r\n  color: #2d2d2d;\r\n  text-align: inherit;\r\n  white-space: nowrap;\r\n  background-color: transparent;\r\n  border: 0;\r\n  -webkit-tap-highlight-color: transparent;\r\n}\r\n\r\n.dropdown-item:hover {\r\n  color: #fff;\r\n  background-color: #007bff;\r\n  text-decoration: none;\r\n}\r\n\r\n.dropdown-divider {\r\n  height: 0;\r\n  margin: 0.25rem 0;\r\n  overflow: hidden;\r\n  border-top: 1px solid #eee;\r\n}\r\n\r\n.dropdown-header {\r\n  display: block;\r\n  padding: 0.25rem .5rem;\r\n  margin-bottom: 0;\r\n  font-size: 0.875rem;\r\n  color: #777;\r\n  white-space: nowrap;\r\n  margin-top: 0;\r\n  font-weight: 400;\r\n}\r\n\r\n.menu-header {\r\n  font-weight: bold;\r\n  padding: 0rem .5rem;\r\n}";
styleInject(css_248z);

var BasicColorPicker = function (_a) {
    var onChange = _a.onChange; _a.onClose;
    var colors = [
        '#FF9999', '#99FF99', '#9999FF', // Lighter red, green, blue
        '#FFFF99', '#FF99FF', '#99FFFF', // Lighter yellow, magenta, cyan
        '#FFB366', '#B3FF66', '#66B3FF', // Muted orange, lime, sky blue
        '#B366FF', '#66FFB3', "#FFFFFF" // Soft pink, purple, mint
    ];
    return (React.createElement("div", { style: {
            position: 'absolute',
            background: 'white',
            padding: '10px',
            border: '1px solid #ccc',
            borderRadius: '4px',
            boxShadow: '0 2px 5px rgba(0,0,0,0.2)',
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '5px',
        } }, colors.map(function (color, index) { return (React.createElement("button", { key: index, style: {
            width: '30px',
            height: '30px',
            background: color,
            border: '1px solid #ddd',
            borderRadius: '4px',
            cursor: 'pointer'
        }, onClick: function () {
            if (color === "#FFFFFF") {
                onChange({ hex: null });
            }
            else {
                onChange({ hex: color });
            }
        } })); })));
};

var RectTree = React$1.forwardRef(function (_a, ref) {
    var data = _a.data, _b = _a.width, width = _b === void 0 ? 1000 : _b, onNodeClick = _a.onNodeClick, onLinkClick = _a.onLinkClick, onLeafClick = _a.onLeafClick, onNodeMouseOver = _a.onNodeMouseOver, onNodeMouseOut = _a.onNodeMouseOut, onLeafMouseOver = _a.onLeafMouseOver, onLeafMouseOut = _a.onLeafMouseOut, onLinkMouseOver = _a.onLinkMouseOver, onLinkMouseOut = _a.onLinkMouseOut, customNodeMenuItems = _a.customNodeMenuItems, customLeafMenuItems = _a.customLeafMenuItems, customLinkMenuItems = _a.customLinkMenuItems, nodeStyler = _a.nodeStyler, linkStyler = _a.linkStyler, leafStyler = _a.leafStyler, homeNode = _a.homeNode, state = _a.state;
    var _c = React$1.useState(false), variableLinks = _c[0], setVariableLinks = _c[1];
    var _d = React$1.useState(true), displayLeaves = _d[0], setDisplayLeaves = _d[1];
    var _e = React$1.useState(false), tipAlign = _e[0], setTipAlign = _e[1];
    var linkExtensionRef = React$1.useRef(null);
    var linkRef = React$1.useRef(null);
    var nodesRef = React$1.useRef(null);
    var containerRef = React$1.useRef(null);
    var leafLabelsRef = React$1.useRef(null);
    var tooltipRef = React$1.useRef(null);
    var svgRef = React$1.useRef(null);
    var variableLinksRef = React$1.useRef(false); // Using this ref so highlighting descendants updates correctly
    var _f = React$1.useState(0), refreshTrigger = _f[0], setRefreshTrigger = _f[1];
    var _g = React$1.useState(null), varData = _g[0], setVarData = _g[1];
    var stateRef = React$1.useRef(state);
    React$1.useEffect(function () {
        stateRef.current = state;
    }, [state]);
    React$1.useEffect(function () {
        if (!data)
            return;
        var convertedData = convertToD3Format(readTree(data));
        if (!convertedData)
            return;
        var root = hierarchy(convertedData);
        var tree$1 = tree();
        // Generate tree layout
        var treeData = tree$1(root);
        setVarData(treeData);
    }, [data, refreshTrigger]);
    var maxLength = function (d) {
        return (d.data.value || 0) + (d.children ? max$1(d.children, maxLength) || 0 : 0);
    };
    var setRadius = function (d, y0, k) {
        d.radius = (y0 += d.data.value || 0) * k;
        if (d.children)
            d.children.forEach(function (d) { return setRadius(d, y0, k); });
    };
    function linkRectangular(startX, startY, endX, endY) {
        return "M" + startY + "," + startX // Move to start point
            + "V" + endX
            + "H" + endY; // Draw horizontal line to end X
    }
    function linkVariable(d) {
        var _a, _b, _c, _d;
        return linkRectangular((_a = d.source.x) !== null && _a !== void 0 ? _a : 0, (_b = d.source.radius) !== null && _b !== void 0 ? _b : 0, (_c = d.target.x) !== null && _c !== void 0 ? _c : 0, (_d = d.target.radius) !== null && _d !== void 0 ? _d : 0);
    }
    function linkConstant(d) {
        var _a, _b, _c, _d;
        return linkRectangular((_a = d.source.x) !== null && _a !== void 0 ? _a : 0, (_b = d.source.y) !== null && _b !== void 0 ? _b : 0, (_c = d.target.x) !== null && _c !== void 0 ? _c : 0, (_d = d.target.y) !== null && _d !== void 0 ? _d : 0);
    }
    function linkExtensionVariable(d) {
        var _a, _b, _c, _d;
        return linkRectangular((_a = d.target.x) !== null && _a !== void 0 ? _a : 0, (_b = d.target.radius) !== null && _b !== void 0 ? _b : 0, (_c = d.target.x) !== null && _c !== void 0 ? _c : 0, (_d = varData === null || varData === void 0 ? void 0 : varData.leaves()[0].y) !== null && _d !== void 0 ? _d : 0);
    }
    function linkExtensionConstant(d) {
        var _a, _b, _c, _d;
        return linkRectangular((_a = d.target.x) !== null && _a !== void 0 ? _a : 0, (_b = d.target.y) !== null && _b !== void 0 ? _b : 0, (_c = d.target.x) !== null && _c !== void 0 ? _c : 0, (_d = varData === null || varData === void 0 ? void 0 : varData.leaves()[0].y) !== null && _d !== void 0 ? _d : 0);
    }
    function nodeTransformVariable(d) {
        return "translate(".concat(d.radius, ",").concat(d.x, ")");
    }
    function nodeTransformConstant(d) {
        return "translate(".concat(d.y, ",").concat(d.x, ")");
    }
    React$1.useEffect(function () {
        var _a;
        if (!containerRef.current || !varData)
            return;
        // Zoom behavior
        var zoom$1 = zoom()
            .scaleExtent([0.1, 20])
            .on('zoom', function (event) {
            svgMain.select("g").attr('transform', event.transform);
        });
        // Clear existing content
        select(containerRef.current).selectAll("*").remove();
        // Setup SVG
        var svgMain = select(containerRef.current)
            .append("svg")
            .attr("width", "100%") // Set width to 100%
            .attr("height", "100%") // Set height to 100%
            .attr("font-family", "sans-serif")
            .attr("font-size", 10)
            .call(zoom$1);
        var svg = svgMain.append("g")
            .attr("class", "tree")
            .attr("transform", "translate(50,0)"); // Move tree off the left edge of the screen
        var cluster$1 = cluster()
            .nodeSize([10, 20])
            .separation(function (a, b) { return 2; }); // Equal separation between nodes
        cluster$1(varData);
        setRadius(varData, 0, ((_a = varData.leaves()[0].y) !== null && _a !== void 0 ? _a : 0) / maxLength(varData));
        // Link functions
        function linkhovered(active) {
            return function (event, d) {
                var _a;
                if (active) {
                    onLinkMouseOver === null || onLinkMouseOver === void 0 ? void 0 : onLinkMouseOver(event, d.source, d.target);
                }
                else {
                    onLinkMouseOut === null || onLinkMouseOut === void 0 ? void 0 : onLinkMouseOut(event, d.source, d.target);
                }
                select(this).classed("link--active", active);
                if (d.target.linkExtensionNode) {
                    select(d.target.linkExtensionNode).classed("link-extension--active", active).raise();
                }
                highlightDescendantsRect(d.target, active, variableLinksRef.current, svg, (_a = varData === null || varData === void 0 ? void 0 : varData.leaves()[0].y) !== null && _a !== void 0 ? _a : 0);
            };
        }
        function linkClicked(event, d) {
            selectAll('.tooltip-node').remove();
            var menu = select(containerRef.current)
                .append('div')
                .attr('class', 'menu-node')
                .style('position', 'fixed')
                .style('left', "".concat(event.clientX + 10, "px"))
                .style('top', "".concat(event.clientY - 10, "px"))
                .style('opacity', 1)
                .node();
            var MenuContent = (React$1.createElement(React$1.Fragment, null,
                React$1.createElement("div", { className: "menu-header" },
                    d.source.data.name,
                    "-",
                    d.target.data.name),
                React$1.createElement("div", { className: "menu-buttons" },
                    React$1.createElement("div", { className: "dropdown-divider" }), customLinkMenuItems === null || customLinkMenuItems === void 0 ? void 0 :
                    customLinkMenuItems.map(function (item) {
                        if (item.toShow(d.source, d.target)) {
                            return (React$1.createElement("a", { className: "dropdown-item", onClick: function () { item.onClick(d.source, d.target); menu === null || menu === void 0 ? void 0 : menu.remove(); } }, item.label(d.source, d.target)));
                        }
                    }))));
            if (menu) {
                var root = client.createRoot(menu);
                root.render(MenuContent);
                setTimeout(function () {
                    var handleClickOutside = function (e) {
                        if (menu && !menu.contains(e.target)) {
                            try {
                                menu.remove();
                            }
                            catch (e) { // When rerooting, tree display is refreshed and menu is removed
                                console.error(e);
                            }
                            window.removeEventListener('click', handleClickOutside);
                        }
                    };
                    window.addEventListener('click', handleClickOutside);
                }, 5);
            }
            var linkElement = select(event.target);
            var isHighlighted = linkElement.classed('link--highlight');
            linkElement
                .classed('link--highlight', !isHighlighted)
                .raise();
            onLinkClick === null || onLinkClick === void 0 ? void 0 : onLinkClick(event, d.source, d.target);
        }
        // Draw links
        var linkExtensions = svg.append("g")
            .attr("class", "link-extensions")
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("stroke-opacity", 0.25)
            .attr("stroke-dasharray", "4,4")
            .selectAll("path")
            .data(varData.links().filter(function (d) { return !d.target.children; })) // targets nodes without children
            .join("path")
            .each(function (d) { d.target.linkExtensionNode = this; })
            .attr("d", linkExtensionConstant);
        var links = svg.append("g")
            .attr("class", "links")
            .attr("fill", "none")
            .attr("stroke", "#444")
            .selectAll("path")
            .data(varData.links())
            .join("path")
            .each(function (d) { d.target.linkNode = this; })
            .attr("d", linkConstant)
            .attr("stroke", function (d) { return d.target.color || "#000"; })
            .style("cursor", "pointer")
            .on("mouseover", linkhovered(true))
            .on("mouseout", linkhovered(false))
            .on("click", linkClicked);
        // If given linkStyler, apply it
        if (linkStyler) {
            links.each(function (d) { return linkStyler(d.source, d.target); });
        }
        // Leaf functions
        function leafhovered(active) {
            return function (event, d) {
                if (active) {
                    onLeafMouseOver === null || onLeafMouseOver === void 0 ? void 0 : onLeafMouseOver(event, d);
                }
                else {
                    onLeafMouseOut === null || onLeafMouseOut === void 0 ? void 0 : onLeafMouseOut(event, d);
                }
                select(this).classed("label--active", active);
                if (d.linkExtensionNode) {
                    select(d.linkExtensionNode).classed("link-extension--active", active).raise();
                }
                do {
                    if (d.linkNode) {
                        select(d.linkNode).classed("link--active", active).raise();
                    }
                } while (d.parent && (d = d.parent));
            };
        }
        function leafClicked(event, d) {
            selectAll('.tooltip-node').remove();
            var menu = select(containerRef.current)
                .append('div')
                .attr('class', 'menu-node')
                .style('position', 'fixed')
                .style('left', "".concat(event.clientX + 10, "px"))
                .style('top', "".concat(event.clientY - 10, "px"))
                .style('opacity', 1)
                .node();
            var MenuContent = (React$1.createElement(React$1.Fragment, null,
                React$1.createElement("div", { className: "menu-header" }, d.data.name),
                React$1.createElement("div", { className: "menu-buttons" },
                    React$1.createElement("div", { className: "dropdown-header" }, "Toggle Selections"),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () { return toggleHighlightLinkToRoot(d); } }, "Path to Root"),
                    React$1.createElement("div", { className: "dropdown-divider" }), customLeafMenuItems === null || customLeafMenuItems === void 0 ? void 0 :
                    customLeafMenuItems.map(function (item) {
                        if (item.toShow(d)) {
                            return (React$1.createElement("a", { className: "dropdown-item", onClick: function () { item.onClick(d); menu === null || menu === void 0 ? void 0 : menu.remove(); } }, item.label(d)));
                        }
                    }))));
            if (menu) {
                var root = client.createRoot(menu);
                root.render(MenuContent);
                setTimeout(function () {
                    var handleClickOutside = function (e) {
                        if (menu && !menu.contains(e.target)) {
                            try {
                                menu.remove();
                            }
                            catch (e) { // When rerooting, tree display is refreshed and menu is removed
                                console.error(e);
                            }
                            window.removeEventListener('click', handleClickOutside);
                        }
                    };
                    window.addEventListener('click', handleClickOutside);
                }, 5);
            }
            onLeafClick === null || onLeafClick === void 0 ? void 0 : onLeafClick(event, d);
        }
        // Draw leaf labels
        var leafLabels = svg.append("g")
            .attr("class", "leaves")
            .selectAll(".leaf-label")
            .data(varData.leaves())
            .join("text")
            .each(function (d) { d.labelElement = this; })
            .attr("class", "leaf-label")
            .attr("dy", ".31em")
            .attr("transform", function (d) { var _a; return "translate(".concat(((_a = d.y) !== null && _a !== void 0 ? _a : 0) + 4, ",").concat(d.x, ")"); })
            .text(function (d) { return d.data.name.replace(/_/g, " "); })
            .on("mouseover", leafhovered(true))
            .on("mouseout", leafhovered(false))
            .on("click", leafClicked);
        // If given leafStyler, apply it
        if (leafStyler) {
            leafLabels.each(function (d) { return leafStyler(d); });
        }
        // Node functions
        function nodeHovered(active) {
            return function (event, d) {
                var _a;
                if (active) {
                    onNodeMouseOver === null || onNodeMouseOver === void 0 ? void 0 : onNodeMouseOver(event, d);
                }
                else {
                    onNodeMouseOut === null || onNodeMouseOut === void 0 ? void 0 : onNodeMouseOut(event, d);
                }
                select(this).classed("node--active", active);
                // Highlight connected links
                if (d.linkExtensionNode) {
                    select(d.linkExtensionNode)
                        .classed("link-extension--active", active)
                        .raise();
                }
                // Highlight path to root
                var current = d;
                do {
                    if (current.linkNode) {
                        select(current.linkNode)
                            .classed("link--important", active)
                            .raise();
                    }
                } while (current.parent && (current = current.parent));
                // Highlight descendants
                highlightDescendantsRect(d, active, variableLinksRef.current, svg, (_a = varData === null || varData === void 0 ? void 0 : varData.leaves()[0].y) !== null && _a !== void 0 ? _a : 0);
            };
        }
        function showHoverLabel(event, d) {
            // Clear any existing tooltips
            selectAll('.tooltip-node').remove();
            tooltipRef.current = select(containerRef.current)
                .append('div')
                .attr('class', 'tooltip-node')
                .style('position', 'fixed')
                .style('left', "".concat(event.clientX + 10, "px"))
                .style('top', "".concat(event.clientY - 10, "px"))
                .style('opacity', 0)
                .html("".concat(d.data.name, "<br/>Leaves: ").concat(countLeaves$1(d)));
            tooltipRef.current
                .transition()
                .duration(200)
                .style('opacity', 1);
        }
        function hideHoverLabel() {
            if (tooltipRef.current) {
                tooltipRef.current
                    .transition()
                    .duration(200)
                    .style('opacity', 0)
                    .remove();
            }
        }
        function nodeClicked(event, d) {
            selectAll('.tooltip-node').remove();
            // This renders a menu for node options
            var menu = select(containerRef.current)
                .append('div')
                .attr('class', 'menu-node')
                .style('position', 'fixed')
                .style('left', "".concat(event.clientX + 10, "px"))
                .style('top', "".concat(event.clientY - 10, "px"))
                .style('opacity', 1)
                .node();
            var MenuContent = (React$1.createElement(React$1.Fragment, null,
                React$1.createElement("div", { className: "menu-header" }, d.data.name),
                React$1.createElement("div", { className: "menu-buttons" },
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () { return toggleCollapseClade$1(d); } }, "Collapse Clade"),
                    React$1.createElement("div", { className: "dropdown-divider" }),
                    React$1.createElement("div", { className: "dropdown-header" }, "Toggle Selections"),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () { return toggleHighlightDescendantLinks$1(d); } }, "Descendant Links"),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () { return toggleHighlightTerminalLinks$1(d); } }, "Terminal Links"),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () { return toggleHighlightLinkToRoot(d); } }, "Path to Root"),
                    React$1.createElement("div", { className: "dropdown-divider" }),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function (e) {
                            e.preventDefault();
                            var target = e.currentTarget;
                            var picker = target.querySelector('div');
                            if (!picker)
                                return;
                            // Toggle visibility of this picker
                            picker.style.display = picker.style.display == "none" ? "block" : "none";
                        } },
                        "Highlight Clade",
                        React$1.createElement("div", { style: {
                                position: 'absolute',
                                left: "150px",
                                top: "180px",
                                display: 'none',
                            } },
                            React$1.createElement(BasicColorPicker, { onClose: function () { }, onChange: function (color) {
                                    var _a, _b;
                                    if (color.hex === null) {
                                        colorDescendantsRect(d, false, variableLinksRef.current, svg, (_a = varData === null || varData === void 0 ? void 0 : varData.leaves()[0].y) !== null && _a !== void 0 ? _a : 0, "");
                                        addColorState(d.data.name, "", true);
                                    }
                                    else {
                                        colorDescendantsRect(d, true, variableLinksRef.current, svg, (_b = varData === null || varData === void 0 ? void 0 : varData.leaves()[0].y) !== null && _b !== void 0 ? _b : 0, color.hex);
                                        addColorState(d.data.name, color.hex);
                                    }
                                } }))),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () {
                            if (varData) {
                                setVarData(reroot(d, varData));
                                addRootState(d.data.name);
                            }
                        } }, "Reroot Here"),
                    React$1.createElement("div", { className: "dropdown-divider" }), customNodeMenuItems === null || customNodeMenuItems === void 0 ? void 0 :
                    customNodeMenuItems.map(function (item) {
                        if (item.toShow(d)) {
                            return (React$1.createElement("a", { className: "dropdown-item", onClick: function () { item.onClick(d); menu === null || menu === void 0 ? void 0 : menu.remove(); } }, item.label(d)));
                        }
                    }))));
            if (menu) {
                var root = client.createRoot(menu);
                root.render(MenuContent);
                setTimeout(function () {
                    var handleClickOutside = function (e) {
                        if (menu && !menu.contains(e.target)) {
                            try {
                                menu.remove();
                            }
                            catch (e) { // When rerooting, tree display is refreshed and menu is removed
                                console.error(e);
                            }
                            window.removeEventListener('click', handleClickOutside);
                        }
                    };
                    window.addEventListener('click', handleClickOutside);
                }, 5);
            }
            // Call callback
            onNodeClick === null || onNodeClick === void 0 ? void 0 : onNodeClick(event, d);
        }
        // Create nodes
        var nodes = svg.append("g")
            .attr("class", "nodes")
            .selectAll(".node")
            .data(varData.descendants().filter(function (d) { return d.children; }))
            .join("g")
            .each(function (d) { d.nodeElement = this; })
            .attr("class", "inner-node")
            .attr("transform", function (d) { return "translate(".concat(d.y, ",").concat(d.x, ")"); });
        // Add circles for nodes
        nodes.append("circle")
            .attr("r", 3)
            .style("fill", "#fff")
            .style("stroke", "steelblue")
            .style("stroke-width", 1.5)
            .on("click", nodeClicked)
            .on("mouseover", nodeHovered(true))
            .on("mouseout", nodeHovered(false))
            .on('mouseenter', showHoverLabel)
            .on('mouseleave', hideHoverLabel);
        // If given nodeStyler, apply it
        if (nodeStyler) {
            nodes.each(function (d) { return nodeStyler(d); });
        }
        linkExtensionRef.current = linkExtensions;
        linkRef.current = links;
        nodesRef.current = nodes;
        leafLabelsRef.current = leafLabels;
        svgRef.current = svgMain.node();
        // Finally, zoom to center
        if (svgRef.current && containerRef.current) {
            findAndZoom$1(homeNode || varData.data.name, select(svgRef.current), containerRef, variableLinks);
        }
    }, [varData, width]);
    React$1.useEffect(function () {
        if (varData) {
            // Apply root if specified
            if (stateRef.current && stateRef.current.root) {
                findAndReroot(stateRef.current.root);
            }
        }
    }, [varData, stateRef.current]);
    React$1.useEffect(function () {
        if (varData && stateRef.current && stateRef.current.colorDict) {
            for (var _i = 0, _a = Object.entries(stateRef.current.colorDict); _i < _a.length; _i++) {
                var _b = _a[_i], name_1 = _b[0], color = _b[1];
                findAndColor(name_1, color);
            }
        }
    }, [varData, stateRef.current]);
    React$1.useEffect(function () {
        var _a, _b, _c, _d, _e, _f;
        var t = transition().duration(750);
        if (!tipAlign) {
            (_a = linkExtensionRef.current) === null || _a === void 0 ? void 0 : _a.transition(t).attr("d", variableLinks ? linkExtensionVariable : linkExtensionConstant).style("display", null);
        }
        else {
            (_b = linkExtensionRef.current) === null || _b === void 0 ? void 0 : _b.transition(t).style("display", "none");
        }
        // Transition between variable and constant links
        (_c = linkRef.current) === null || _c === void 0 ? void 0 : _c.transition(t).attr("d", variableLinks ? linkVariable : linkConstant);
        // Transition nodes to stay in correct position
        (_d = nodesRef.current) === null || _d === void 0 ? void 0 : _d.transition(t).attr("transform", variableLinks ? nodeTransformVariable : nodeTransformConstant);
        variableLinksRef.current = variableLinks; // This ref update is for highlighting descendants
        // If alignTips is true, set leaf label text transform to be radius value of it's data
        var farRadius = (_e = varData === null || varData === void 0 ? void 0 : varData.leaves()[0].y) !== null && _e !== void 0 ? _e : 0;
        (_f = leafLabelsRef.current) === null || _f === void 0 ? void 0 : _f.transition(t).attr("transform", function (d) {
            var distance = tipAlign
                ? (variableLinksRef.current ? d.radius : farRadius + 4)
                : farRadius + 4;
            return "translate(".concat(distance, ",").concat(d.x, ")");
        });
    }, [variableLinks, tipAlign]);
    React$1.useEffect(function () {
        var _a, _b;
        (_a = leafLabelsRef.current) === null || _a === void 0 ? void 0 : _a.style("display", displayLeaves ? "block" : "none");
        (_b = linkExtensionRef.current) === null || _b === void 0 ? void 0 : _b.style("display", displayLeaves ? "block" : "none");
    }, [displayLeaves]);
    var recenterView = function () {
        var svg = select(containerRef.current).select('svg').select('g');
        svg.transition()
            .duration(750)
            .attr('transform', "translate(50,0)");
    };
    var findAndReroot = function (name) {
        // Recursively search through data for node with name
        if (varData) {
            var findNode_1 = function (node) {
                if (node.data.name === name) {
                    return node;
                }
                if (node.children) {
                    for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        var found = findNode_1(child);
                        if (found)
                            return found;
                    }
                }
                return null;
            };
            // Find node and reroot if found
            var targetNode = findNode_1(varData);
            if (targetNode) {
                setVarData(reroot(targetNode, varData));
            }
        }
    };
    var findAndColor = function (name, color) {
        var _a;
        if (varData) {
            var findNode_2 = function (node) {
                if (node.data.name === name) {
                    return node;
                }
                if (node.children) {
                    for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        var found = findNode_2(child);
                        if (found)
                            return found;
                    }
                }
                return null;
            };
            var targetNode = findNode_2(varData);
            if (targetNode && svgRef.current) {
                colorDescendantsRect(targetNode, true, variableLinksRef.current, select(svgRef.current).select('g'), (_a = varData.leaves()[0].y) !== null && _a !== void 0 ? _a : 0, color);
            }
        }
    };
    var addColorState = function (name, color, remove) {
        var _a;
        if (remove === void 0) { remove = false; }
        if (remove) {
            if (stateRef.current && stateRef.current.colorDict) {
                delete stateRef.current.colorDict[name];
            }
        }
        else if (stateRef.current) {
            stateRef.current.colorDict = stateRef.current.colorDict || {};
            stateRef.current.colorDict[name] = color;
        }
        else {
            stateRef.current = { colorDict: (_a = {}, _a[name] = color, _a) };
        }
    };
    var addRootState = function (name) {
        if (stateRef.current) {
            stateRef.current.root = name;
        }
        else {
            stateRef.current = { root: name };
        }
    };
    React$1.useImperativeHandle(ref, function () { return ({
        getLinkExtensions: function () { return linkExtensionRef.current; },
        getLinks: function () { return linkRef.current; },
        getNodes: function () { return nodesRef.current; },
        getLeaves: function () { return leafLabelsRef.current; },
        setVariableLinks: function (value) { return setVariableLinks(value); },
        setDisplayLeaves: function (value) { return setDisplayLeaves(value); },
        setTipAlign: function (value) { return setTipAlign(value); },
        recenterView: function () { return recenterView(); },
        refresh: function () {
            setRefreshTrigger(function (prev) { return prev + 1; });
            stateRef.current = {};
        },
        resetRoot: function () {
            if (stateRef.current) {
                delete stateRef.current.root;
            }
            setRefreshTrigger(function (prev) { return prev + 1; });
        },
        clearHighlights: function () {
            if (stateRef.current) {
                delete stateRef.current.colorDict;
            }
            setRefreshTrigger(function (prev) { return prev + 1; });
        },
        getRoot: function () { return varData; },
        getContainer: function () { return containerRef.current; },
        findAndZoom: function (name, container) {
            if (svgRef.current) {
                findAndZoom$1(name, select(svgRef.current), container, variableLinks);
            }
        },
        findAndReroot: findAndReroot,
        getState: function () { return stateRef.current; }
    }); });
    return (React$1.createElement("div", { className: "radial-tree", style: { width: "100%", height: "100%" } },
        React$1.createElement("div", { ref: containerRef, style: {
                width: "100%",
                height: "100%",
                overflow: "show"
            } })));
});

var RadialTree = React$1.forwardRef(function (_a, ref) {
    var data = _a.data, _b = _a.width, width = _b === void 0 ? 1000 : _b, onNodeClick = _a.onNodeClick, onLinkClick = _a.onLinkClick, onLeafClick = _a.onLeafClick, onNodeMouseOver = _a.onNodeMouseOver, onNodeMouseOut = _a.onNodeMouseOut, onLeafMouseOver = _a.onLeafMouseOver, onLeafMouseOut = _a.onLeafMouseOut, onLinkMouseOver = _a.onLinkMouseOver, onLinkMouseOut = _a.onLinkMouseOut, customNodeMenuItems = _a.customNodeMenuItems, customLeafMenuItems = _a.customLeafMenuItems, customLinkMenuItems = _a.customLinkMenuItems, nodeStyler = _a.nodeStyler, linkStyler = _a.linkStyler, leafStyler = _a.leafStyler, homeNode = _a.homeNode, state = _a.state;
    var _c = React$1.useState(false), variableLinks = _c[0], setVariableLinks = _c[1];
    var _d = React$1.useState(true), displayLeaves = _d[0], setDisplayLeaves = _d[1];
    var _e = React$1.useState(false), tipAlign = _e[0], setTipAlign = _e[1];
    var linkExtensionRef = React$1.useRef(null);
    var linkRef = React$1.useRef(null);
    var nodesRef = React$1.useRef(null);
    var containerRef = React$1.useRef(null);
    var leafLabelsRef = React$1.useRef(null);
    var tooltipRef = React$1.useRef(null);
    var svgRef = React$1.useRef(null);
    var variableLinksRef = React$1.useRef(false); // Using this ref so highlighting descendants updates correctly
    var _f = React$1.useState(0), refreshTrigger = _f[0], setRefreshTrigger = _f[1];
    var _g = React$1.useState(null), varData = _g[0], setVarData = _g[1];
    var stateRef = React$1.useRef(state);
    var outerRadius = width / 2;
    var innerRadius = outerRadius - 170;
    // Store the given state in a ref
    React$1.useEffect(function () {
        stateRef.current = state;
    }, [state]);
    /**
     * The code block below reads a raw newick string and
     * stores the tree object in varData
     */
    React$1.useEffect(function () {
        if (!data)
            return;
        var convertedData = convertToD3Format(readTree(data));
        if (!convertedData)
            return;
        var root = hierarchy(convertedData);
        var tree$1 = tree();
        // Generate tree layout
        var treeData = tree$1(root);
        setVarData(treeData);
    }, [data, refreshTrigger]);
    var maxLength = function (d) {
        return (d.data.value || 0) + (d.children ? max$1(d.children, maxLength) || 0 : 0);
    };
    var setRadius = function (d, y0, k) {
        d.radius = (y0 += d.data.value || 0) * k;
        if (d.children)
            d.children.forEach(function (d) { return setRadius(d, y0, k); });
    };
    function linkStep(startAngle, startRadius, endAngle, endRadius) {
        var c0 = Math.cos(startAngle = (startAngle - 90) / 180 * Math.PI);
        var s0 = Math.sin(startAngle);
        var c1 = Math.cos(endAngle = (endAngle - 90) / 180 * Math.PI);
        var s1 = Math.sin(endAngle);
        return "M" + startRadius * c0 + "," + startRadius * s0
            + (endAngle === startAngle ? "" : "A" + startRadius + "," + startRadius + " 0 0 " + (endAngle > startAngle ? 1 : 0) + " " + startRadius * c1 + "," + startRadius * s1)
            + "L" + endRadius * c1 + "," + endRadius * s1;
    }
    /**
     * These two functions below are used to draw links between nodes
     * in the tree. The first function is used when the links must be
     * representative distances, whereas the second function is used
     * when the links must be extend to reach the outer radius.
     */
    function linkVariable(d) {
        var _a, _b, _c, _d;
        return linkStep((_a = d.source.x) !== null && _a !== void 0 ? _a : 0, (_b = d.source.radius) !== null && _b !== void 0 ? _b : 0, (_c = d.target.x) !== null && _c !== void 0 ? _c : 0, (_d = d.target.radius) !== null && _d !== void 0 ? _d : 0);
    }
    function linkConstant(d) {
        var _a, _b, _c, _d;
        return linkStep((_a = d.source.x) !== null && _a !== void 0 ? _a : 0, (_b = d.source.y) !== null && _b !== void 0 ? _b : 0, (_c = d.target.x) !== null && _c !== void 0 ? _c : 0, (_d = d.target.y) !== null && _d !== void 0 ? _d : 0);
    }
    /**
     * As with the above, these two functions are used to draw links
     * between leaf nodes and their labels
     */
    function linkExtensionVariable(d) {
        var _a, _b, _c;
        return linkStep((_a = d.target.x) !== null && _a !== void 0 ? _a : 0, (_b = d.target.radius) !== null && _b !== void 0 ? _b : 0, (_c = d.target.x) !== null && _c !== void 0 ? _c : 0, innerRadius);
    }
    function linkExtensionConstant(d) {
        var _a, _b, _c;
        return linkStep((_a = d.target.x) !== null && _a !== void 0 ? _a : 0, (_b = d.target.y) !== null && _b !== void 0 ? _b : 0, (_c = d.target.x) !== null && _c !== void 0 ? _c : 0, innerRadius);
    }
    /**
     * The below two functions calculate node's position
     */
    function nodeTransformVariable(d) {
        var _a, _b;
        return "\n      rotate(".concat(((_a = d.x) !== null && _a !== void 0 ? _a : 0) - 90, ") \n      translate(").concat(d.radius || d.y, ",0)\n      ").concat(((_b = d.x) !== null && _b !== void 0 ? _b : 0) >= 180 ? "rotate(180)" : "", "\n    ");
    }
    function nodeTransformConstant(d) {
        var _a, _b;
        return "\n      rotate(".concat(((_a = d.x) !== null && _a !== void 0 ? _a : 0) - 90, ") \n      translate(").concat(d.y, ",0)\n      ").concat(((_b = d.x) !== null && _b !== void 0 ? _b : 0) >= 180 ? "rotate(180)" : "", "\n    ");
    }
    // Render tree
    React$1.useEffect(function () {
        if (!containerRef.current || !varData)
            return;
        // Zoom behavior
        var zoom$1 = zoom()
            .scaleExtent([0.1, 20]) // Min/max zoom level
            .on('zoom', function (event) {
            svgMain.select("g").attr('transform', event.transform);
        });
        // Clear existing content
        select(containerRef.current).selectAll("*").remove();
        // Make SVG element
        var svgMain = select(containerRef.current).append("svg")
            .attr("width", "100%") // Set width to 100%
            .attr("height", "100%") // Set height to 100%
            .attr("font-family", "sans-serif")
            .attr("font-size", 5) // TODO: Make this a param
            .call(zoom$1);
        var svg = svgMain.append("g") // The tree will go into this group
            .attr("class", "tree");
        var cluster$1 = cluster()
            .size([355, innerRadius]) // [angle to spread nodes, radius]
            .separation(function (a, b) { return 1; });
        // Places leaves all on same level
        cluster$1(varData);
        setRadius(varData, 0, innerRadius / maxLength(varData));
        // Link functions
        function linkhovered(active) {
            return function (event, d) {
                if (active) {
                    onLinkMouseOver === null || onLinkMouseOver === void 0 ? void 0 : onLinkMouseOver(event, d.source, d.target);
                }
                else {
                    onLinkMouseOut === null || onLinkMouseOut === void 0 ? void 0 : onLinkMouseOut(event, d.source, d.target);
                }
                select(this).classed("link--active", active);
                if (d.target.linkExtensionNode) {
                    select(d.target.linkExtensionNode).classed("link-extension--active", active).raise();
                }
                highlightDescendantsRadial(d.target, active, variableLinksRef.current, svg, innerRadius);
            };
        }
        // Draw links
        var linkExtensions = svg.append("g")
            .attr("class", "link-extensions")
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("stroke-opacity", 0.25)
            .attr("stroke-dasharray", "4,4")
            .selectAll("path")
            .data(varData.links().filter(function (d) { return !d.target.children; })) // targets nodes without children
            .join("path")
            .each(function (d) { d.target.linkExtensionNode = this; })
            .attr("d", linkExtensionConstant);
        function linkClicked(event, d) {
            selectAll('.tooltip-node').remove();
            var menu = select(containerRef.current)
                .append('div')
                .attr('class', 'menu-node')
                .style('position', 'fixed')
                .style('left', "".concat(event.clientX + 10, "px"))
                .style('top', "".concat(event.clientY - 10, "px"))
                .style('opacity', 1)
                .node();
            var MenuContent = (React$1.createElement(React$1.Fragment, null,
                React$1.createElement("div", { className: "menu-header" },
                    d.source.data.name,
                    "-",
                    d.target.data.name),
                React$1.createElement("div", { className: "menu-buttons" },
                    React$1.createElement("div", { className: "dropdown-divider" }), customLinkMenuItems === null || customLinkMenuItems === void 0 ? void 0 :
                    customLinkMenuItems.map(function (item) {
                        if (item.toShow(d.source, d.target)) {
                            return (React$1.createElement("a", { className: "dropdown-item", onClick: function () { item.onClick(d.source, d.target); menu === null || menu === void 0 ? void 0 : menu.remove(); } }, item.label(d.source, d.target)));
                        }
                    }))));
            if (menu) {
                var root = client.createRoot(menu);
                root.render(MenuContent);
                setTimeout(function () {
                    var handleClickOutside = function (e) {
                        if (menu && !menu.contains(e.target)) {
                            try {
                                menu.remove();
                            }
                            catch (e) { // When rerooting, tree display is refreshed and menu is removed
                                console.error(e);
                            }
                            window.removeEventListener('click', handleClickOutside);
                        }
                    };
                    window.addEventListener('click', handleClickOutside);
                }, 5);
            }
            var linkElement = select(event.target);
            var isHighlighted = linkElement.classed('link--highlight');
            linkElement
                .classed('link--highlight', !isHighlighted)
                .raise();
            onLinkClick === null || onLinkClick === void 0 ? void 0 : onLinkClick(event, d.source, d.target);
        }
        var links = svg.append("g")
            .attr("class", "links")
            .attr("fill", "none")
            .attr("stroke", "#444")
            .selectAll("path")
            .data(varData.links())
            .join("path")
            .each(function (d) { d.target.linkNode = this; })
            .attr("d", linkConstant)
            .attr("stroke", function (d) { return d.target.color || "#000"; })
            .style("cursor", "pointer")
            .on("mouseover", linkhovered(true))
            .on("mouseout", linkhovered(false))
            .on("click", linkClicked);
        // If given linkStyler, apply it
        if (linkStyler) {
            links.each(function (d) { return linkStyler(d.source, d.target); });
        }
        // Leaf functions
        function leafhovered(active) {
            return function (event, d) {
                if (active) {
                    onLeafMouseOver === null || onLeafMouseOver === void 0 ? void 0 : onLeafMouseOver(event, d);
                }
                else {
                    onLeafMouseOut === null || onLeafMouseOut === void 0 ? void 0 : onLeafMouseOut(event, d);
                }
                select(this).classed("label--active", active);
                if (d.linkExtensionNode) {
                    select(d.linkExtensionNode).classed("link-extension--active", active).raise();
                }
                do {
                    if (d.linkNode) {
                        select(d.linkNode).classed("link--active", active).raise();
                    }
                } while (d.parent && (d = d.parent));
            };
        }
        function leafClicked(event, d) {
            selectAll('.tooltip-node').remove();
            var menu = select(containerRef.current)
                .append('div')
                .attr('class', 'menu-node')
                .style('position', 'fixed')
                .style('left', "".concat(event.clientX + 10, "px"))
                .style('top', "".concat(event.clientY - 10, "px"))
                .style('opacity', 1)
                .node();
            var MenuContent = (React$1.createElement(React$1.Fragment, null,
                React$1.createElement("div", { className: "menu-header" }, d.data.name),
                React$1.createElement("div", { className: "menu-buttons" },
                    React$1.createElement("div", { className: "dropdown-header" }, "Toggle Selections"),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () { return toggleHighlightLinkToRoot(d); } }, "Path to Root"),
                    React$1.createElement("div", { className: "dropdown-divider" }), customLeafMenuItems === null || customLeafMenuItems === void 0 ? void 0 :
                    customLeafMenuItems.map(function (item) {
                        if (item.toShow(d)) {
                            return (React$1.createElement("a", { className: "dropdown-item", onClick: function () { item.onClick(d); menu === null || menu === void 0 ? void 0 : menu.remove(); } }, item.label(d)));
                        }
                    }))));
            if (menu) {
                var root = client.createRoot(menu);
                root.render(MenuContent);
                setTimeout(function () {
                    var handleClickOutside = function (e) {
                        if (menu && !menu.contains(e.target)) {
                            try {
                                menu.remove();
                            }
                            catch (e) { // When rerooting, tree display is refreshed and menu is removed
                                console.error(e);
                            }
                            window.removeEventListener('click', handleClickOutside);
                        }
                    };
                    window.addEventListener('click', handleClickOutside);
                }, 5);
            }
            onLeafClick === null || onLeafClick === void 0 ? void 0 : onLeafClick(event, d);
        }
        // Draw leaf labels
        var leafLabels = svg.append("g")
            .attr("class", "leaves")
            .selectAll(".leaf-label")
            .data(varData.leaves())
            .join("text")
            .each(function (d) { d.labelElement = this; })
            .attr("class", "leaf-label")
            .attr("dy", ".31em")
            .attr("transform", function (d) { var _a, _b; return "rotate(".concat(((_a = d.x) !== null && _a !== void 0 ? _a : 0) - 90, ") translate(").concat(innerRadius + 4, ",0)").concat(((_b = d.x) !== null && _b !== void 0 ? _b : 0) < 180 ? "" : " rotate(180)"); })
            .attr("text-anchor", function (d) { var _a; return ((_a = d.x) !== null && _a !== void 0 ? _a : 0) < 180 ? "start" : "end"; })
            .text(function (d) { return d.data.name.replace(/_/g, " "); })
            .on("mouseover", leafhovered(true))
            .on("mouseout", leafhovered(false))
            .on("click", leafClicked);
        // If given leafStyler, apply it
        if (leafStyler) {
            leafLabels.each(function (d) { return leafStyler(d); });
        }
        // Node functions
        function nodeHovered(active) {
            return function (event, d) {
                if (active) {
                    onNodeMouseOver === null || onNodeMouseOver === void 0 ? void 0 : onNodeMouseOver(event, d);
                }
                else {
                    onNodeMouseOut === null || onNodeMouseOut === void 0 ? void 0 : onNodeMouseOut(event, d);
                }
                select(this).classed("node--active", active);
                // Highlight connected links
                if (d.linkExtensionNode) {
                    select(d.linkExtensionNode)
                        .classed("link-extension--active", active)
                        .raise();
                }
                // Highlight path to root
                var current = d;
                do {
                    if (current.linkNode) {
                        select(current.linkNode)
                            .classed("link--important", active)
                            .raise();
                    }
                } while (current.parent && (current = current.parent));
                // Highlight descendants
                highlightDescendantsRadial(d, active, variableLinksRef.current, svg, innerRadius);
            };
        }
        /**
         * On hover over an internal node, display a tooltip with the node's name
         * and the number of leaves in its clade.
         * TODO: Add a param to allow users to customize the tooltip content.
         */
        function showHoverLabel(event, d) {
            // Clear any existing tooltips
            selectAll('.tooltip-node').remove();
            tooltipRef.current = select(containerRef.current)
                .append('div')
                .attr('class', 'tooltip-node')
                .style('position', 'fixed')
                .style('left', "".concat(event.clientX + 10, "px"))
                .style('top', "".concat(event.clientY - 10, "px"))
                .style('opacity', 0)
                .html("".concat(d.data.name, "<br/>Leaves: ").concat(countLeaves$1(d)));
            tooltipRef.current
                .transition()
                .duration(200)
                .style('opacity', 1);
        }
        function hideHoverLabel() {
            if (tooltipRef.current) {
                tooltipRef.current
                    .transition()
                    .duration(200)
                    .style('opacity', 0)
                    .remove();
            }
        }
        function nodeClicked(event, d) {
            selectAll('.tooltip-node').remove();
            var menu = select(containerRef.current)
                .append('div')
                .attr('class', 'menu-node')
                .style('position', 'fixed')
                .style('left', "".concat(event.clientX + 10, "px"))
                .style('top', "".concat(event.clientY - 10, "px"))
                .style('opacity', 1)
                .node();
            var MenuContent = (React$1.createElement(React$1.Fragment, null,
                React$1.createElement("div", { className: "menu-header" }, d.data.name),
                React$1.createElement("div", { className: "menu-buttons" },
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () { return toggleCollapseClade$1(d); } }, "Collapse Clade"),
                    React$1.createElement("div", { className: "dropdown-divider" }),
                    React$1.createElement("div", { className: "dropdown-header" }, "Toggle Selections"),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () { return toggleHighlightDescendantLinks$1(d); } }, "Descendant Links"),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () { return toggleHighlightTerminalLinks$1(d); } }, "Terminal Links"),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () { return toggleHighlightLinkToRoot(d); } }, "Path to Root"),
                    React$1.createElement("div", { className: "dropdown-divider" }),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function (e) {
                            e.preventDefault();
                            var target = e.currentTarget;
                            var picker = target.querySelector('div');
                            if (!picker)
                                return;
                            // Toggle visibility of this picker
                            picker.style.display = picker.style.display == "none" ? "block" : "none";
                        } },
                        "Highlight Clade",
                        React$1.createElement("div", { style: {
                                position: 'absolute',
                                left: "150px",
                                top: "180px",
                                display: 'none',
                            } },
                            React$1.createElement(BasicColorPicker, { onClose: function () { }, onChange: function (color) {
                                    var _a, _b;
                                    if (color.hex === null) {
                                        colorDescendantsRadial(d, false, variableLinksRef.current, svg, (_a = varData === null || varData === void 0 ? void 0 : varData.leaves()[0].y) !== null && _a !== void 0 ? _a : 0, "");
                                        addColorState(d.data.name, "", true);
                                    }
                                    else {
                                        colorDescendantsRadial(d, true, variableLinksRef.current, svg, (_b = varData === null || varData === void 0 ? void 0 : varData.leaves()[0].y) !== null && _b !== void 0 ? _b : 0, color.hex);
                                        addColorState(d.data.name, color.hex);
                                    }
                                } }))),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () {
                            if (varData) {
                                setVarData(reroot(d, varData));
                                addRootState(d.data.name);
                            }
                        } }, "Reroot Here"),
                    React$1.createElement("div", { className: "dropdown-divider" }), customNodeMenuItems === null || customNodeMenuItems === void 0 ? void 0 :
                    customNodeMenuItems.map(function (item) {
                        if (item.toShow(d)) {
                            return (React$1.createElement("a", { className: "dropdown-item", onClick: function () { item.onClick(d); menu === null || menu === void 0 ? void 0 : menu.remove(); } }, item.label(d)));
                        }
                    }))));
            if (menu) {
                var root = client.createRoot(menu);
                root.render(MenuContent);
                setTimeout(function () {
                    var handleClickOutside = function (e) {
                        if (menu && !menu.contains(e.target)) {
                            try {
                                menu.remove();
                            }
                            catch (e) { // When rerooting, tree display is refreshed and menu is removed
                                console.error(e);
                            }
                            window.removeEventListener('click', handleClickOutside);
                        }
                    };
                    window.addEventListener('click', handleClickOutside);
                }, 5);
            }
            // This is the user-defined callback
            onNodeClick === null || onNodeClick === void 0 ? void 0 : onNodeClick(event, d);
        }
        // Add nodes to svg
        var nodes = svg.append("g")
            .attr("class", "nodes")
            .selectAll(".node")
            .data(varData.descendants().filter(function (d) { return d.children; }))
            .join("g")
            .each(function (d) { d.nodeElement = this; })
            .attr("class", "inner-node")
            .attr("transform", function (d) {
            var _a, _b;
            return "\n        rotate(".concat(((_a = d.x) !== null && _a !== void 0 ? _a : 0) - 90, ") \n        translate(").concat(d.y, ",0)\n        ").concat(((_b = d.x) !== null && _b !== void 0 ? _b : 0) >= 180 ? "rotate(180)" : "", "\n    ");
        });
        // Add circles for nodes
        nodes.append("circle")
            .attr("r", 3)
            .style("fill", "#fff")
            .style("stroke", "steelblue")
            .style("stroke-width", 1.5)
            .on("click", nodeClicked)
            .on("mouseover", nodeHovered(true))
            .on("mouseout", nodeHovered(false))
            .on('mouseenter', showHoverLabel)
            .on('mouseleave', hideHoverLabel);
        // If given nodeStyler, apply it
        if (nodeStyler) {
            nodes.each(function (d) { return nodeStyler(d); });
        }
        linkExtensionRef.current = linkExtensions;
        linkRef.current = links;
        nodesRef.current = nodes;
        leafLabelsRef.current = leafLabels;
        svgRef.current = svgMain.node();
        // Finally, zoom to center
        if (svgRef.current && containerRef.current) {
            findAndZoom$2(homeNode || varData.data.name, select(svgRef.current), containerRef, variableLinks);
        }
    }, [varData, width]);
    React$1.useEffect(function () {
        if (varData) {
            // Apply root if specified
            if (stateRef.current && stateRef.current.root) {
                findAndReroot(stateRef.current.root);
            }
        }
    }, [varData, stateRef.current]);
    React$1.useEffect(function () {
        if (varData && stateRef.current && stateRef.current.colorDict) {
            for (var _i = 0, _a = Object.entries(stateRef.current.colorDict); _i < _a.length; _i++) {
                var _b = _a[_i], name_1 = _b[0], color = _b[1];
                findAndColor(name_1, color);
            }
        }
    }, [varData, stateRef.current]);
    React$1.useEffect(function () {
        var _a, _b, _c, _d, _e;
        var t = transition().duration(750);
        if (!tipAlign) {
            (_a = linkExtensionRef.current) === null || _a === void 0 ? void 0 : _a.transition(t).attr("d", variableLinks ? linkExtensionVariable : linkExtensionConstant).style("display", null);
        }
        else {
            (_b = linkExtensionRef.current) === null || _b === void 0 ? void 0 : _b.transition(t).style("display", "none");
        }
        // Transition between variable and constant links
        (_c = linkRef.current) === null || _c === void 0 ? void 0 : _c.transition(t).attr("d", variableLinks ? linkVariable : linkConstant);
        // Transition nodes to stay in correct position
        (_d = nodesRef.current) === null || _d === void 0 ? void 0 : _d.transition(t).attr("transform", variableLinks ? nodeTransformVariable : nodeTransformConstant);
        variableLinksRef.current = variableLinks; // This ref update is for highlighting descendants
        // If alignTips is true, set leaf label text transform to be radius value of it's data
        (_e = leafLabelsRef.current) === null || _e === void 0 ? void 0 : _e.transition(t).attr("transform", function (d) {
            var _a, _b;
            var angle = ((_a = d.x) !== null && _a !== void 0 ? _a : 0) - 90;
            var distance = tipAlign
                ? (variableLinksRef.current ? d.radius : innerRadius + 4)
                : innerRadius + 4;
            var flip = ((_b = d.x) !== null && _b !== void 0 ? _b : 0) < 180 ? "" : " rotate(180)";
            return "rotate(".concat(angle, ") translate(").concat(distance, ",0)").concat(flip);
        });
    }, [variableLinks, tipAlign]);
    React$1.useEffect(function () {
        var _a, _b;
        (_a = leafLabelsRef.current) === null || _a === void 0 ? void 0 : _a.style("display", displayLeaves ? "block" : "none");
        (_b = linkExtensionRef.current) === null || _b === void 0 ? void 0 : _b.style("display", displayLeaves ? "block" : "none");
    }, [displayLeaves]);
    var recenterView = function () {
        var svg = select(containerRef.current).select('svg').select('g');
        svg.transition()
            .duration(750)
            .attr('transform', "translate(0,0)");
    };
    var findAndReroot = function (name) {
        // Recursively search through data for node with name
        if (varData) {
            var findNode_1 = function (node) {
                if (node.data.name === name) {
                    return node;
                }
                if (node.children) {
                    for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        var found = findNode_1(child);
                        if (found)
                            return found;
                    }
                }
                return null;
            };
            // Find node and reroot if found
            var targetNode = findNode_1(varData);
            if (targetNode) {
                setVarData(reroot(targetNode, varData));
            }
        }
    };
    /**
     * Searches for node with given name and colors it and its descendants
     * Currently used to apply the color state
     */
    var findAndColor = function (name, color) {
        var _a;
        if (varData) {
            var findNode_2 = function (node) {
                if (node.data.name === name) {
                    return node;
                }
                if (node.children) {
                    for (var _i = 0, _a = node.children; _i < _a.length; _i++) {
                        var child = _a[_i];
                        var found = findNode_2(child);
                        if (found)
                            return found;
                    }
                }
                return null;
            };
            var targetNode = findNode_2(varData);
            if (targetNode && svgRef.current) {
                colorDescendantsRadial(targetNode, true, variableLinksRef.current, select(svgRef.current).select('g'), (_a = varData.leaves()[0].y) !== null && _a !== void 0 ? _a : 0, color);
            }
        }
    };
    /**
     * The below two functions handle updating the current state
     */
    var addColorState = function (name, color, remove) {
        var _a;
        if (remove === void 0) { remove = false; }
        if (remove) {
            if (stateRef.current && stateRef.current.colorDict) {
                delete stateRef.current.colorDict[name];
            }
        }
        else if (stateRef.current) {
            stateRef.current.colorDict = stateRef.current.colorDict || {};
            stateRef.current.colorDict[name] = color;
        }
        else {
            stateRef.current = { colorDict: (_a = {}, _a[name] = color, _a) };
        }
    };
    var addRootState = function (name) {
        if (stateRef.current) {
            stateRef.current.root = name;
        }
        else {
            stateRef.current = { root: name };
        }
    };
    // These functions may be called from a ref to the tree object
    React$1.useImperativeHandle(ref, function () { return ({
        getLinkExtensions: function () { return linkExtensionRef.current; },
        getLinks: function () { return linkRef.current; },
        getNodes: function () { return nodesRef.current; },
        getLeaves: function () { return leafLabelsRef.current; },
        setVariableLinks: function (value) { return setVariableLinks(value); },
        setDisplayLeaves: function (value) { return setDisplayLeaves(value); },
        setTipAlign: function (value) { return setTipAlign(value); },
        recenterView: function () { return recenterView(); },
        refresh: function () {
            setRefreshTrigger(function (prev) { return prev + 1; });
            stateRef.current = {};
        },
        resetRoot: function () {
            if (stateRef.current) {
                delete stateRef.current.root;
            }
            setRefreshTrigger(function (prev) { return prev + 1; });
        },
        clearHighlights: function () {
            if (stateRef.current) {
                delete stateRef.current.colorDict;
            }
            setRefreshTrigger(function (prev) { return prev + 1; });
        },
        getRoot: function () { return varData; },
        getContainer: function () { return containerRef.current; },
        findAndZoom: function (name, container) {
            if (svgRef.current) {
                findAndZoom$2(name, select(svgRef.current), container, variableLinks);
            }
        },
        findAndReroot: findAndReroot,
        getState: function () { return stateRef.current; }
    }); });
    return (React$1.createElement("div", { className: "radial-tree", style: { width: "100%", height: "100%" } },
        React$1.createElement("div", { ref: containerRef, style: {
                width: "100%",
                height: "100%",
                overflow: "show"
            } })));
});

var getAllLeafCoords = function (node, scale) {
    var coords = [];
    var source = node.parent;
    if (!source)
        return coords;
    var target = node;
    // Accounting for linkExtensions
    var sourceX = source.x * scale;
    var sourceY = source.y * scale;
    var targetX = target.x * scale;
    var targetY = target.y * scale;
    var angle = Math.atan2(targetY - sourceY, targetX - sourceX);
    // Extend in direction based on text-anchor
    var extensionLength = 600;
    var extendedX = targetX + Math.cos(angle) * extensionLength;
    var extendedY = targetY + Math.sin(angle) * extensionLength;
    if (node.children && node.children.length === 0) {
        coords.push({
            x: extendedX,
            y: extendedY
        });
    }
    if (node.children) {
        node.children.forEach(function (child) {
            coords.push.apply(coords, getAllLeafCoords(child, scale));
        });
    }
    return coords;
};
var countLeaves = function (node) {
    if (!node.children || node.children.length === 0) {
        return 1;
    }
    return node.children.reduce(function (sum, child) { return sum + countLeaves(child); }, 0);
};
function highlightClade(node, active, svg, scale) {
    if (node.isTip)
        return;
    // Get array of all coordinates of children
    var childrenCoords = getAllLeafCoords(node, scale);
    var complexPath = function (coords, nodeX, nodeY) {
        var path = "M ".concat(nodeX, " ").concat(nodeY);
        coords.forEach(function (coord) {
            path += " L ".concat(coord.x, " ").concat(coord.y);
        });
        path += " L ".concat(nodeX, " ").concat(nodeY);
        return path;
    };
    // Remove existing highlight
    svg.selectAll('.highlight-box').remove();
    if (active) {
        // Node center point
        var nodeX = node.x * scale;
        var nodeY = node.y * scale;
        svg.insert('path', ':first-child')
            .attr('class', 'highlight-box')
            .attr('d', complexPath(childrenCoords, nodeX, nodeY))
            .style('fill', 'rgba(255, 255, 0, 0.2)')
            .style('stroke', 'none');
    }
}
function colorClade(node, active, svg, scale, color) {
    if (node.isTip)
        return;
    // Get array of all coordinates of children
    var childrenCoords = getAllLeafCoords(node, scale);
    var complexPath = function (coords, nodeX, nodeY) {
        var path = "M ".concat(nodeX, " ").concat(nodeY);
        coords.forEach(function (coord) {
            path += " L ".concat(coord.x, " ").concat(coord.y);
        });
        path += " L ".concat(nodeX, " ").concat(nodeY);
        return path;
    };
    // Remove existing highlight
    svg.selectAll(".color-box-".concat(node.data.name)).remove();
    if (active) {
        // Node center point
        var nodeX = node.x * scale;
        var nodeY = node.y * scale;
        var colorGroup = svg.select('g.color-boxes');
        if (colorGroup.empty()) {
            colorGroup = svg.insert('g', ':first-child')
                .attr('class', 'color-boxes')
                .style('isolation', 'isolate')
                .lower();
        }
        colorGroup.append('path')
            .attr('class', "color-box color-box-".concat(node.data.name))
            .attr('d', complexPath(childrenCoords, nodeX, nodeY))
            .style('fill', color)
            .style('stroke', 'none')
            .style('composite-operation', 'source-over');
    }
}
// mapChildren is different from UnrootedNodes. Children are stored in children as TreeNodes (without elements data), and in 
// forwardLinkNodes as SVGPathElements. We need to recurse through the forwardLinkNodes to get the children.
function mapChildren(node, callback) {
    if (node.forwardLinkNodes) {
        node.forwardLinkNodes.forEach(function (pathElement) {
            var linkData = pathElement.__data__;
            if (linkData && linkData.target) {
                mapChildren(linkData.target, callback);
            }
        });
    }
    callback(node);
}
function toggleElementClass(element, className, active) {
    if (!element)
        return;
    select(element).classed(className, active);
}
function toggleCollapseClade(node) {
    if (node.nodeElement) {
        var isHidden_1 = select(node.nodeElement).select("circle").classed('node--collapsed');
        select(node.nodeElement).select("circle").classed('node--collapsed', !isHidden_1);
        if (node.children) {
            node.children.forEach(function (child) {
                mapChildren(child, function (child) {
                    toggleElementClass(child.linkNode, 'link--hidden', !isHidden_1);
                    toggleElementClass(child.nodeElement, 'link--hidden', !isHidden_1);
                    toggleElementClass(child.linkExtensionNode, 'link--hidden', !isHidden_1);
                    toggleElementClass(child.labelElement, 'link--hidden', !isHidden_1);
                    // Reset any collapsed nodes under this clade
                    if (child.nodeElement) {
                        select(child.nodeElement).select("circle").classed('node--collapsed', !isHidden_1);
                    }
                });
            });
        }
    }
}
function toggleHighlightDescendantLinks(node) {
    if (node.forwardLinkNodes) {
        node.forwardLinkNodes.forEach(function (child) {
            mapChildren(child.__data__.target, function (child) {
                if (child.linkNode) {
                    var isHighlighted = select(child.linkNode).classed('link--highlight');
                    select(child.linkNode).classed('link--highlight', !isHighlighted);
                }
            });
        });
    }
}
function toggleHighlightTerminalLinks(node) {
    // Recurse through all children and highlight links
    if (node.children) {
        node.children.forEach(function (child) {
            mapChildren(child, function (child) {
                if (child.children.length === 0 && child.linkNode) {
                    var isHighlighted = select(child.linkNode).classed('link--highlight');
                    select(child.linkNode).classed('link--highlight', !isHighlighted);
                }
            });
        });
    }
}
function findAndZoom(name, svg, container, scale) {
    var _a, _b;
    // Find node with name in tree
    var node = svg.select('g.nodes')
        .selectAll('g.inner-node')
        .filter(function (d) { return d.data.name === name; });
    // Find leaf with name in tree
    var leaf = svg.select('g.leaves')
        .selectAll('text.leaf-label')
        .filter(function (d) { return d.data.name === name; });
    if (!node.empty()) { // Found node
        var nodeElement = node.node();
        var nodeData = node.data()[0];
        if (!nodeElement) {
            return;
        }
        var x = ((_a = nodeData.x) !== null && _a !== void 0 ? _a : 0) * scale;
        var y = ((_b = nodeData.y) !== null && _b !== void 0 ? _b : 0) * scale;
        // Center the node
        var centerOffsetX = container.current.clientWidth / 2;
        var centerOffsetY = container.current.clientHeight / 2;
        var zoom$1 = zoom().on("zoom", function (event) {
            svg.select("g").attr("transform", event.transform);
        });
        svg.transition()
            .duration(750)
            .call(zoom$1.transform, identity
            .translate(-x + centerOffsetX, -y + centerOffsetY)
            .scale(1));
        var circle = select(nodeElement).select('circle');
        var currRadius = circle.attr("r");
        var currColor = circle.style("fill");
        var newRadius = (parseFloat(currRadius) * 2).toString();
        circle.transition()
            .delay(1000)
            .style("fill", "red")
            .style("r", newRadius)
            .transition()
            .duration(750)
            .style("fill", currColor)
            .style("r", currRadius)
            .transition()
            .duration(750)
            .style("fill", "red")
            .style("r", newRadius)
            .transition()
            .duration(750)
            .style("fill", currColor)
            .style("r", currRadius);
    }
    else if (!leaf.empty()) { // Found leaf
        var leafElement = leaf.node();
        var leafData = leaf.data()[0];
        if (!leafElement) {
            return;
        }
        var path = leafData.linkExtensionNode;
        if (path) {
            var pathStrValue = path.getAttribute('d') || '';
            var lastLCoords = pathStrValue.match(/L\s*([0-9.-]+)\s*,?\s*([0-9.-]+)\s*$/);
            if (lastLCoords) {
                lastLCoords[0]; var x = lastLCoords[1], y = lastLCoords[2];
                // Center the node
                var centerOffsetX = container.current.clientWidth / 2;
                var centerOffsetY = container.current.clientHeight / 2;
                var zoom$1 = zoom().on("zoom", function (event) {
                    svg.select("g").attr("transform", event.transform);
                });
                // Apply transform here
                svg.transition()
                    .duration(750)
                    .call(zoom$1.transform, identity
                    .translate(-x + centerOffsetX, -y + centerOffsetY)
                    .scale(1));
                // Pulse the leaf label and link extension
                var text = select(leafElement);
                var currColor = text.style("fill");
                var currSize = text.style("font-size");
                var newSize = (parseFloat(currSize) * 2).toString();
                text.transition()
                    .delay(750)
                    .style("fill", "red")
                    .style("font-size", newSize)
                    .transition()
                    .duration(750)
                    .style("fill", currColor)
                    .style("font-size", currSize)
                    .transition()
                    .duration(750)
                    .style("fill", "red")
                    .style("font-size", newSize)
                    .transition()
                    .duration(750)
                    .style("fill", currColor)
                    .style("font-size", currSize);
                // Pulse the link extension
                var linkExtension = select(path);
                var currStroke = linkExtension.style("stroke");
                var currStrokeWidth = linkExtension.style("stroke-width");
                var newStrokeWidth = (parseFloat(currStrokeWidth) * 2).toString();
                linkExtension.transition()
                    .delay(750)
                    .style("stroke", "red")
                    .style("stroke-width", newStrokeWidth)
                    .transition()
                    .duration(750)
                    .style("stroke", currStroke)
                    .style("stroke-width", currStrokeWidth)
                    .transition()
                    .duration(750)
                    .style("stroke", "red")
                    .style("stroke-width", newStrokeWidth)
                    .transition()
                    .duration(750)
                    .style("stroke", currStroke)
                    .style("stroke-width", currStrokeWidth);
            }
        }
    }
}

var UnrootedTree = React$1.forwardRef(function (_a, ref) {
    var data = _a.data, _b = _a.scale, scale = _b === void 0 ? 500 : _b, onNodeClick = _a.onNodeClick, onLinkClick = _a.onLinkClick, onLeafClick = _a.onLeafClick, onNodeMouseOver = _a.onNodeMouseOver, onNodeMouseOut = _a.onNodeMouseOut, onLeafMouseOver = _a.onLeafMouseOver, onLeafMouseOut = _a.onLeafMouseOut, onLinkMouseOver = _a.onLinkMouseOver, onLinkMouseOut = _a.onLinkMouseOut, customNodeMenuItems = _a.customNodeMenuItems, customLeafMenuItems = _a.customLeafMenuItems, customLinkMenuItems = _a.customLinkMenuItems, nodeStyler = _a.nodeStyler, linkStyler = _a.linkStyler, leafStyler = _a.leafStyler, homeNode = _a.homeNode, _c = _a.linkRoot, linkRoot = _c === void 0 ? true : _c, state = _a.state;
    var _d = React$1.useState(true), displayLeaves = _d[0], setDisplayLeaves = _d[1];
    var linkExtensionRef = React$1.useRef(null);
    var linkRef = React$1.useRef(null);
    var nodesRef = React$1.useRef(null);
    var leafLabelsRef = React$1.useRef(null);
    var containerRef = React$1.useRef(null);
    var tooltipRef = React$1.useRef(null);
    var svgRef = React$1.useRef(null);
    var _e = React$1.useState(0), refreshTrigger = _e[0], setRefreshTrigger = _e[1];
    var _f = React$1.useState(null), varData = _f[0], setVarData = _f[1];
    var initialStateApplied = React$1.useRef(false); // Used to prevent infinite loop when setting state
    var stateRef = React$1.useRef(state);
    // Read tree and calculate layout
    React$1.useEffect(function () {
        if (!data)
            return;
        var tree = {
            data: [],
            edges: []
        };
        var eq = fortify(equalAngleLayout(readTree(data)));
        tree.data = eq;
        tree.edges = edges(eq);
        setVarData(tree);
    }, [data, refreshTrigger]);
    // Main helper methods
    var getBoundingBox = function (data) {
        var nodes = data.data;
        var edges = data.edges;
        var minX = Infinity, maxX = -Infinity;
        var minY = Infinity, maxY = -Infinity;
        // Check nodes
        nodes.forEach(function (node) {
            minX = Math.min(minX, node.x * scale);
            maxX = Math.max(maxX, node.x * scale);
            minY = Math.min(minY, node.y * scale);
            maxY = Math.max(maxY, node.y * scale);
        });
        // Check edges
        edges.forEach(function (edge) {
            minX = Math.min(minX, edge.source.x * scale, edge.target.x * scale);
            maxX = Math.max(maxX, edge.source.x * scale, edge.target.x * scale);
            minY = Math.min(minY, edge.source.y * scale, edge.target.y * scale);
            maxY = Math.max(maxY, edge.source.y * scale, edge.target.y * scale);
        });
        var padding = 50;
        return {
            x: minX - padding,
            y: minY - padding,
            width: maxX - minX + padding * 2,
            height: maxY - minY + padding * 2
        };
    };
    var linkPath = function (d) {
        var sourceX = d.source.x * scale;
        var sourceY = d.source.y * scale;
        var targetX = d.target.x * scale;
        var targetY = d.target.y * scale;
        return "M".concat(sourceX, ",").concat(sourceY, "L").concat(targetX, ",").concat(targetY);
    };
    var linkExtension = function (d) {
        if (!d.target.labelElement)
            return '';
        var sourceX = d.source.x * scale;
        var sourceY = d.source.y * scale;
        var targetX = d.target.x * scale;
        var targetY = d.target.y * scale;
        // Calculate angle and extension direction
        var angle = Math.atan2(targetY - sourceY, targetX - sourceX);
        // Extend in direction based on text-anchor
        var extensionLength = 600;
        var extendedX = targetX + Math.cos(angle) * extensionLength;
        var extendedY = targetY + Math.sin(angle) * extensionLength;
        return "M".concat(sourceX, ",").concat(sourceY, "L").concat(extendedX, ",").concat(extendedY);
    };
    // Rotate leafLabels based on angle of the link, and flip for readability
    var getRotate = function (d) {
        var _a, _b, _c, _d;
        var x1 = (_b = (_a = d.parent) === null || _a === void 0 ? void 0 : _a.x) !== null && _b !== void 0 ? _b : 0;
        var y1 = (_d = (_c = d.parent) === null || _c === void 0 ? void 0 : _c.y) !== null && _d !== void 0 ? _d : 0;
        var x2 = d.x;
        var y2 = d.y;
        var angle = Math.atan2(y2 - y1, x2 - x1) * (180 / Math.PI);
        // Flip text if angle is past -90
        if (angle < -90 || angle > 90) {
            angle += 180;
            return "rotate(".concat(angle, ", ").concat(d.x * scale, ", ").concat(d.y * scale, ")");
        }
        return "rotate(".concat(angle, ", ").concat(d.x * scale, ", ").concat(d.y * scale, ")");
    };
    React$1.useEffect(function () {
        if (!containerRef.current || !varData)
            return;
        // Clear existing content
        select(containerRef.current).selectAll("*").remove();
        // Initialize SVG Main container, used for zoom/pan listening
        var bbox = getBoundingBox(varData);
        var initialScale = 0.5;
        var translateX = (containerRef.current.clientWidth - bbox.width * initialScale) / 2 - bbox.x * initialScale;
        var translateY = (containerRef.current.clientHeight - bbox.height * initialScale) / 2 - bbox.y * initialScale;
        var initialTransform = identity.translate(translateX, translateY).scale(initialScale);
        var svgMain = select(containerRef.current).append("svg")
            //.attr("viewBox", `0 0 ${bbox.width} ${bbox.height}`)
            .attr("width", "100%")
            .attr("height", "100%")
            .attr("font-family", "sans-serif")
            .attr("font-size", 5);
        // Initialize base SVG group
        var svg = svgMain.append("g").attr("class", "tree");
        //.attr("transform", `translate(${translateX}, ${translateY})`);
        // Create zoom behavior
        var zoom$1 = zoom()
            .scaleExtent([0.2, 8])
            .on('zoom', function (event) {
            svg.attr('transform', event.transform);
        });
        // Apply zoom behavior
        svgMain.call(zoom$1);
        // Link functions
        function linkhovered(active) {
            return function (event, d) {
                if (active) {
                    onLinkMouseOver === null || onLinkMouseOver === void 0 ? void 0 : onLinkMouseOver(event, d.source, d.target);
                }
                else {
                    onLinkMouseOut === null || onLinkMouseOut === void 0 ? void 0 : onLinkMouseOut(event, d.source, d.target);
                }
                select(this).classed("link--active", active);
                if (d.target.linkExtensionNode) {
                    select(d.target.linkExtensionNode).classed("link-extension--active", active).raise();
                }
                highlightClade(d.target, active, svg, scale);
            };
        }
        function linkClicked(event, d) {
            selectAll('.tooltip-node').remove();
            var menu = select(containerRef.current)
                .append('div')
                .attr('class', 'menu-node')
                .style('position', 'fixed')
                .style('left', "".concat(event.clientX + 10, "px"))
                .style('top', "".concat(event.clientY - 10, "px"))
                .style('opacity', 1)
                .node();
            var MenuContent = (React$1.createElement(React$1.Fragment, null,
                React$1.createElement("div", { className: "menu-header" },
                    d.source.thisName,
                    "-",
                    d.target.thisName),
                React$1.createElement("div", { className: "menu-buttons" },
                    React$1.createElement("div", { className: "dropdown-divider" }),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () {
                            if (varData) {
                                rootOnBranch(d);
                                addRootState(d.target.thisName);
                            }
                        } }, "Root Here"),
                    React$1.createElement("div", { className: "dropdown-divider" }), customLinkMenuItems === null || customLinkMenuItems === void 0 ? void 0 :
                    customLinkMenuItems.map(function (item) {
                        if (item.toShow(d.source, d.target)) {
                            return (React$1.createElement("a", { className: "dropdown-item", onClick: function () { item.onClick(d.source, d.target); menu === null || menu === void 0 ? void 0 : menu.remove(); } }, item.label(d.source, d.target)));
                        }
                    }))));
            if (menu) {
                var root = client.createRoot(menu);
                root.render(MenuContent);
                setTimeout(function () {
                    var handleClickOutside = function (e) {
                        if (menu && !menu.contains(e.target)) {
                            try {
                                menu.remove();
                            }
                            catch (e) { // When rerooting, tree display is refreshed and menu is removed
                                console.error(e);
                            }
                            window.removeEventListener('click', handleClickOutside);
                        }
                    };
                    window.addEventListener('click', handleClickOutside);
                }, 5);
            }
            var linkElement = select(event.target);
            var isHighlighted = linkElement.classed('link--highlight');
            linkElement
                .classed('link--highlight', !isHighlighted)
                .raise();
            onLinkClick === null || onLinkClick === void 0 ? void 0 : onLinkClick(event, d.source, d.target);
        }
        if (linkRoot) { // Root (Node1) does not have links connecting to or from it
            var root_1 = varData.data[varData.data.length - 1]; // Root is always the last one to be read
            // find the first nontip child node
            var firstChild = root_1.children.find(function (child) { return !child.isTip; });
            var tips = root_1.children.filter(function (child) { return child.isTip; });
            if (firstChild) {
                // Create a link from root to firstChild
                var link = {
                    source: root_1,
                    target: firstChild
                };
                varData.edges.push(link);
            }
            if (tips) {
                tips.forEach(function (tip) {
                    var link = {
                        source: root_1,
                        target: tip
                    };
                    varData.edges.push(link);
                });
            }
        }
        // Draw links first, then calculate and draw extension
        var linksData = varData.edges;
        // Add root node if present
        if (varData.root) {
            linksData = linksData.concat(varData.root.edges);
        }
        var links = svg.append("g")
            .attr("class", "links")
            .attr("fill", "none")
            .attr("stroke", "#444")
            .selectAll("path")
            .data(linksData)
            .join("path")
            .each(function (d) {
            d.target.linkNode = this;
            if (!d.source.forwardLinkNodes) {
                d.source.forwardLinkNodes = [];
            }
            d.source.forwardLinkNodes.push(this);
        })
            .attr("d", linkPath)
            .attr("stroke", function (d) { return d.target.color || "#000"; })
            .style("cursor", "pointer")
            .on("mouseover", linkhovered(true))
            .on("mouseout", linkhovered(false))
            .on("click", linkClicked);
        // If given linkStyler, apply it
        if (linkStyler) {
            links.each(function (d) { return linkStyler(d.source, d.target); });
        }
        // Leaf functions
        function leafhovered(active) {
            return function (event, d) {
                if (active) {
                    onLeafMouseOver === null || onLeafMouseOver === void 0 ? void 0 : onLeafMouseOver(event, d);
                }
                else {
                    onLeafMouseOut === null || onLeafMouseOut === void 0 ? void 0 : onLeafMouseOut(event, d);
                }
                select(this).classed("label--active", active);
                if (d.linkExtensionNode) {
                    select(d.linkExtensionNode).classed("link-extension--active", active).raise();
                }
                do {
                    if (d.linkNode) {
                        select(d.linkNode).classed("link--active", active).raise();
                    }
                } while (d.parent && (d = d.parent));
            };
        }
        function leafClicked(event, d) {
            selectAll('.tooltip-node').remove();
            var menu = select(containerRef.current)
                .append('div')
                .attr('class', 'menu-node')
                .style('position', 'fixed')
                .style('left', "".concat(event.clientX + 10, "px"))
                .style('top', "".concat(event.clientY - 10, "px"))
                .style('opacity', 1)
                .node();
            var MenuContent = (React$1.createElement(React$1.Fragment, null,
                React$1.createElement("div", { className: "menu-header" }, d.data.name),
                React$1.createElement("div", { className: "menu-buttons" },
                    React$1.createElement("div", { className: "dropdown-divider" }), customLeafMenuItems === null || customLeafMenuItems === void 0 ? void 0 :
                    customLeafMenuItems.map(function (item) {
                        if (item.toShow(d)) {
                            return (React$1.createElement("a", { className: "dropdown-item", onClick: function () { item.onClick(d); menu === null || menu === void 0 ? void 0 : menu.remove(); } }, item.label(d)));
                        }
                    }))));
            if (menu) {
                var root = client.createRoot(menu);
                root.render(MenuContent);
                setTimeout(function () {
                    var handleClickOutside = function (e) {
                        if (menu && !menu.contains(e.target)) {
                            try {
                                menu.remove();
                            }
                            catch (e) { // When rerooting, tree display is refreshed and menu is removed
                                console.error(e);
                            }
                            window.removeEventListener('click', handleClickOutside);
                        }
                    };
                    window.addEventListener('click', handleClickOutside);
                }, 5);
            }
            onLeafClick === null || onLeafClick === void 0 ? void 0 : onLeafClick(event, d);
        }
        // Draw leaf labels
        var leafLabels = svg.append("g")
            .attr("class", "leaves")
            .selectAll(".leaf-label")
            .data(varData.data.filter(function (d) { return d.isTip; }))
            .join("text")
            .each(function (d) { d.labelElement = this; })
            .attr("class", "leaf-label")
            .attr("x", function (d) {
            var _a, _b, _c, _d;
            var angle = Math.atan2(d.y - ((_b = (_a = d.parent) === null || _a === void 0 ? void 0 : _a.y) !== null && _b !== void 0 ? _b : 0), d.x - ((_d = (_c = d.parent) === null || _c === void 0 ? void 0 : _c.x) !== null && _d !== void 0 ? _d : 0)) * (180 / Math.PI);
            var isEnd = angle < -90 || angle > 90;
            return d.x * scale + (isEnd ? -600 : 600); // Shifting label away from center depends on it's orientation around center
        })
            .attr("y", function (d) { return d.y * scale; })
            .attr("dy", ".31em")
            .attr("transform", function (d) { return getRotate(d); })
            .attr("text-anchor", function (d) {
            var _a, _b, _c, _d;
            var angle = Math.atan2(d.y - ((_b = (_a = d.parent) === null || _a === void 0 ? void 0 : _a.y) !== null && _b !== void 0 ? _b : 0), d.x - ((_d = (_c = d.parent) === null || _c === void 0 ? void 0 : _c.x) !== null && _d !== void 0 ? _d : 0)) * (180 / Math.PI);
            return (angle < -90 || angle > 90) ? "end" : "start"; // Text anchor depends on it's so reader can read it
        })
            .text(function (d) { return d.thisName.replace(/_/g, " "); })
            .on("mouseover", leafhovered(true))
            .on("mouseout", leafhovered(false))
            .on("click", leafClicked);
        // If given leafStyler, apply it
        if (leafStyler) {
            leafLabels.each(function (d) { return leafStyler(d); });
        }
        // Node functions
        function nodeHovered(active) {
            return function (event, d) {
                if (active) {
                    onNodeMouseOver === null || onNodeMouseOver === void 0 ? void 0 : onNodeMouseOver(event, d);
                }
                else {
                    onNodeMouseOut === null || onNodeMouseOut === void 0 ? void 0 : onNodeMouseOut(event, d);
                }
                select(this).classed("node--active", active);
                // Highlight connected links
                if (d.linkExtensionNode) {
                    select(d.linkExtensionNode)
                        .classed("link-extension--active", active)
                        .raise();
                }
                // Highlight descendants
                highlightClade(d, active, svg, scale);
            };
        }
        function showHoverLabel(event, d) {
            // Clear any existing tooltips
            selectAll('.tooltip-node').remove();
            tooltipRef.current = select(containerRef.current)
                .append('div')
                .attr('class', 'tooltip-node')
                .style('position', 'fixed')
                .style('left', "".concat(event.clientX + 10, "px"))
                .style('top', "".concat(event.clientY - 10, "px"))
                .style('opacity', 0)
                .html("".concat(d.thisName, "<br/>Leaves: ").concat(countLeaves(d)));
            tooltipRef.current
                .transition()
                .duration(200)
                .style('opacity', 1);
        }
        function hideHoverLabel() {
            if (tooltipRef.current) {
                tooltipRef.current
                    .transition()
                    .duration(200)
                    .style('opacity', 0)
                    .remove();
            }
        }
        function nodeClicked(event, d) {
            selectAll('.tooltip-node').remove();
            var menu = select(containerRef.current)
                .append('div')
                .attr('class', 'menu-node')
                .style('position', 'fixed')
                .style('left', "".concat(event.clientX + 10, "px"))
                .style('top', "".concat(event.clientY - 10, "px"))
                .style('opacity', 1)
                .node();
            var MenuContent = (React$1.createElement(React$1.Fragment, null,
                React$1.createElement("div", { className: "menu-header" }, d.thisName),
                React$1.createElement("div", { className: "menu-buttons" },
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () { return toggleCollapseClade(d); } }, "Collapse Clade"),
                    React$1.createElement("div", { className: "dropdown-divider" }),
                    React$1.createElement("div", { className: "dropdown-header" }, "Toggle Selections"),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () { return toggleHighlightDescendantLinks(d); } }, "Descendant Links"),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function () { return toggleHighlightTerminalLinks(d); } }, "Terminal Links"),
                    React$1.createElement("div", { className: "dropdown-divider" }),
                    React$1.createElement("a", { className: "dropdown-item", onClick: function (e) {
                            e.preventDefault();
                            var target = e.currentTarget;
                            var picker = target.querySelector('div');
                            if (!picker)
                                return;
                            // Toggle visibility of this picker
                            picker.style.display = picker.style.display == "none" ? "block" : "none";
                        } },
                        "Highlight Clade",
                        React$1.createElement("div", { style: {
                                position: 'absolute',
                                left: "150px",
                                top: "180px",
                                display: 'none',
                            } },
                            React$1.createElement(BasicColorPicker, { onClose: function () { }, onChange: function (color) {
                                    if (color.hex === null) {
                                        colorClade(d, false, svg, scale, "");
                                        addColorState(d.data.name, "", true);
                                    }
                                    else {
                                        colorClade(d, true, svg, scale, color.hex);
                                        addColorState(d.data.name, color.hex);
                                    }
                                } }))),
                    React$1.createElement("div", { className: "dropdown-divider" }), customNodeMenuItems === null || customNodeMenuItems === void 0 ? void 0 :
                    customNodeMenuItems.map(function (item) {
                        if (item.toShow(d)) {
                            return (React$1.createElement("a", { className: "dropdown-item", onClick: function () { item.onClick(d); menu === null || menu === void 0 ? void 0 : menu.remove(); } }, item.label(d)));
                        }
                    }))));
            if (menu) {
                var root = client.createRoot(menu);
                root.render(MenuContent);
                setTimeout(function () {
                    var handleClickOutside = function (e) {
                        if (menu && !menu.contains(e.target)) {
                            try {
                                menu.remove();
                            }
                            catch (e) { // When rerooting, tree display is refreshed and menu is removed
                                console.error(e);
                            }
                            window.removeEventListener('click', handleClickOutside);
                        }
                    };
                    window.addEventListener('click', handleClickOutside);
                }, 5);
            }
            onNodeClick === null || onNodeClick === void 0 ? void 0 : onNodeClick(event, d);
        }
        // Draw nodes
        var nodesData = varData.data.filter(function (d) { return !d.isTip; });
        // Add root node if present
        if (varData.root) {
            nodesData.push(varData.root.node);
        }
        var nodes = svg.append("g")
            .attr("class", "nodes")
            .selectAll(".node")
            .data(nodesData)
            .join("g")
            .each(function (d) { d.nodeElement = this; })
            .attr("class", "inner-node")
            .attr("transform", function (d) { return "translate(".concat(d.x * scale, ", ").concat(d.y * scale, ")"); });
        // Add circles for nodes
        nodes.append("circle")
            .attr("r", 3)
            .style("fill", "#fff")
            .style("stroke", "steelblue")
            .style("stroke-width", 1.5)
            .on("click", nodeClicked)
            .on("mouseover", nodeHovered(true))
            .on("mouseout", nodeHovered(false))
            .on('mouseenter', showHoverLabel)
            .on('mouseleave', hideHoverLabel);
        // If given nodeStyler, apply it
        if (nodeStyler) {
            nodes.each(function (d) { return nodeStyler(d); });
        }
        // Draw link extensions
        var linkExtensions = svg.append("g")
            .attr("class", "link-extensions")
            .attr("fill", "none")
            .attr("stroke", "#000")
            .attr("stroke-opacity", 0.25)
            .attr("stroke-dasharray", "4,4")
            .selectAll("path")
            .data(varData.edges.filter(function (d) { return d.target.children.length === 0; })) // targets nodes without children
            .join("path")
            .each(function (d) { d.target.linkExtensionNode = this; })
            .attr("d", linkExtension);
        linkExtensionRef.current = linkExtensions;
        linkRef.current = links;
        nodesRef.current = nodes;
        leafLabelsRef.current = leafLabels;
        svgRef.current = svgMain.node();
        // Finally, zoom to center
        if (svgRef.current && containerRef.current) {
            if (homeNode) {
                findAndZoom(homeNode, select(svgRef.current), containerRef, scale);
            }
            else {
                svgMain.call(zoom$1.transform, initialTransform);
            }
        }
    }, [varData]);
    React$1.useEffect(function () {
        if (!initialStateApplied.current && state && varData) {
            initialStateApplied.current = true;
            // Apply root if specified
            if (stateRef.current && stateRef.current.root) {
                console.log("Applying root state");
                findAndAddRoot(stateRef.current.root);
            }
        }
    }, [varData, stateRef.current]);
    React$1.useEffect(function () {
        if (varData && stateRef.current && stateRef.current.colorDict) {
            for (var _i = 0, _a = Object.entries(stateRef.current.colorDict); _i < _a.length; _i++) {
                var _b = _a[_i], name_1 = _b[0], color = _b[1];
                findAndColor(name_1, color);
            }
        }
    }, [varData, stateRef.current]);
    React$1.useEffect(function () {
        var _a, _b;
        (_a = leafLabelsRef.current) === null || _a === void 0 ? void 0 : _a.style("display", displayLeaves ? "block" : "none");
        (_b = linkExtensionRef.current) === null || _b === void 0 ? void 0 : _b.style("display", displayLeaves ? "block" : "none");
    }, [displayLeaves]);
    var recenterView = function () {
        var svg = select(containerRef.current).select('svg').select('g');
        svg.transition()
            .duration(750)
            .attr('transform', "translate(0,0)");
    };
    var rootOnBranch = function (d) {
        var _a;
        var rootNode = {
            parent: null,
            parentId: null,
            parentName: null,
            thisName: 'root',
            thisId: -1,
            children: [d.source, d.target],
            length: 0,
            isTip: false,
            x: (d.source.x + d.target.x) / 2,
            y: (d.source.y + d.target.y) / 2,
            angle: 0,
            data: {
                name: 'root',
                value: 0
            },
            branchset: [d.source, d.target]
        };
        var rootEdges = [{
                source: rootNode,
                target: d.source
            }, {
                source: rootNode,
                target: d.target
            }];
        var newData = addRoot((_a = varData === null || varData === void 0 ? void 0 : varData.data) !== null && _a !== void 0 ? _a : [], d.source, d.target);
        var newEdges = edges(newData);
        setVarData({
            data: newData,
            edges: newEdges,
            root: {
                node: rootNode,
                edges: rootEdges
            }
        });
    };
    var findAndAddRoot = function (name) {
        // Recursively search through data for node with name
        if (varData) {
            var findNode = function (nodes) {
                for (var _i = 0, nodes_1 = nodes; _i < nodes_1.length; _i++) {
                    var node = nodes_1[_i];
                    if (node.thisName === name) {
                        return node;
                    }
                }
                return null;
            };
            // Find node and reroot if found
            var targetNode = findNode(varData.data);
            if (targetNode) {
                if (targetNode.linkNode) {
                    rootOnBranch(select(targetNode.linkNode).datum());
                }
            }
        }
    };
    var findAndColor = function (name, color) {
        if (varData) {
            var findNode = function (nodes) {
                for (var _i = 0, nodes_2 = nodes; _i < nodes_2.length; _i++) {
                    var node = nodes_2[_i];
                    if (node.thisName === name) {
                        return node;
                    }
                }
                return null;
            };
            // Find node and reroot if found
            var targetNode = findNode(varData.data);
            if (targetNode && svgRef.current) {
                colorClade(targetNode, true, select(svgRef.current).select('g'), scale, color);
            }
        }
    };
    var addColorState = function (name, color, remove) {
        var _a;
        if (remove === void 0) { remove = false; }
        if (remove) {
            if (stateRef.current && stateRef.current.colorDict) {
                delete stateRef.current.colorDict[name];
            }
        }
        else if (stateRef.current) {
            stateRef.current.colorDict = stateRef.current.colorDict || {};
            stateRef.current.colorDict[name] = color;
        }
        else {
            stateRef.current = { colorDict: (_a = {}, _a[name] = color, _a) };
        }
    };
    var addRootState = function (name) {
        if (stateRef.current) {
            stateRef.current.root = name;
        }
        else {
            stateRef.current = { root: name };
        }
    };
    React$1.useImperativeHandle(ref, function () { return ({
        getLinkExtensions: function () { return linkExtensionRef.current; },
        getLinks: function () { return linkRef.current; },
        getNodes: function () { return nodesRef.current; },
        getLeaves: function () { return leafLabelsRef.current; },
        setDisplayLeaves: function (value) { return setDisplayLeaves(value); },
        recenterView: function () { return recenterView(); },
        refresh: function () {
            setRefreshTrigger(function (prev) { return prev + 1; });
            stateRef.current = undefined;
        },
        resetRoot: function () {
            if (stateRef.current) {
                delete stateRef.current.root;
            }
            setRefreshTrigger(function (prev) { return prev + 1; });
        },
        clearHighlights: function () {
            if (stateRef.current) {
                delete stateRef.current.colorDict;
            }
            setRefreshTrigger(function (prev) { return prev + 1; });
            initialStateApplied.current = false;
        },
        getRoot: function () { return varData; },
        getData: function () { return varData; },
        getContainer: function () { return containerRef.current; },
        findAndZoom: function (name, container) {
            if (svgRef.current && varData) {
                findAndZoom(name, select(svgRef.current), container, scale);
            }
        },
        getState: function () { return stateRef.current; }
    }); });
    return (React$1.createElement("div", { className: "radial-tree", style: { width: "100%", height: "100%" } },
        React$1.createElement("div", { ref: containerRef, style: {
                width: "100%",
                height: "100%",
                overflow: "show",
            } })));
});
/**
 * Below code was taken from Euphrasiologist's lwPhylo package
 * find it here: https://github.com/Euphrasiologist/lwPhylo
 */
/**
 * Convert parsed Newick tree from fortify() into data frame of edges
 * this is akin to a "phylo" object in R, where thisID and parentId
 * are the $edge slot. I think.
 * - Removed rectangular layout related code
 * - Simplified return data structure to just the source and target
 * - Input is now object of type UnrootedData, calculated edges are Link<UnrootedNode>
 */
function edges(df) {
    var result = [], parent;
    // make sure data frame is sorted
    df.sort(function (a, b) {
        return a.thisId - b.thisId;
    });
    for (var _i = 0, df_1 = df; _i < df_1.length; _i++) {
        var row = df_1[_i];
        if (row.parentId === null) {
            continue; // skip the root
        }
        parent = df[row.parentId];
        if (parent === null || parent === undefined)
            continue;
        var pair = {
            source: parent,
            target: row
        };
        result.push(pair);
    }
    return result;
}
/**
 *
 * @param df List of nodes
 * @param rootLeft Node left of root
 * @param rootRight Node right of root
 * @returns df with root added
 */
function addRoot(df, rootLeft, rootRight) {
    function swap(node) {
        var current = node;
        var parent = node.parent;
        //remove current from parent's children, add parent to current's children
        while (parent && parent != current) { // second condition to prevent infinite loop when double rerooting
            parent.children = parent.children.filter(function (child) { return child !== current; });
            parent.parentId = current.thisId;
            current.children.push(parent);
            // move up the tree
            current = parent;
            var nextparent = parent.parent || null;
            // update parent's parent
            parent.parent = current;
            parent = nextparent;
        }
    }
    if (rootLeft.parentName === rootRight.thisName) { // rootRight child-parent relationships are reversed
        // recursively swap parent and child
        rootRight.children = rootRight.children.filter(function (child) { return child !== rootLeft; });
        swap(rootRight);
    }
    else {
        rootLeft.children = rootLeft.children.filter(function (child) { return child !== rootRight; });
        swap(rootLeft);
    }
    rootRight.parentId = null;
    rootRight.parent = null;
    rootLeft.parentId = null;
    rootLeft.parent = null;
    // For every entry in df, set forwardLinkNodes to empty array
    df.forEach(function (node) {
        node.forwardLinkNodes = [];
    });
    return df;
}
/**
 * Convert parsed Newick tree from readTree() into data
 * frame.
 * this is akin to a "phylo" object in R.
 * EDIT: Instead of preorder traversal, use recursive function
 * so children and parents and linked.
 */
function fortify(tree, sort) {
    if (sort === void 0) { sort = true; }
    var df = [];
    function convertNode(node) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k, _l;
        // Convert current node
        var unrootedNode = {
            parent: node.parent,
            parentId: (_b = (_a = node.parent) === null || _a === void 0 ? void 0 : _a.id) !== null && _b !== void 0 ? _b : null,
            parentName: (_d = (_c = node.parent) === null || _c === void 0 ? void 0 : _c.name) !== null && _d !== void 0 ? _d : null,
            thisId: (_e = node.id) !== null && _e !== void 0 ? _e : -1,
            thisName: (_f = node.name) !== null && _f !== void 0 ? _f : '',
            children: [],
            length: (_g = node.length) !== null && _g !== void 0 ? _g : 0,
            isTip: ((_h = node.branchset) === null || _h === void 0 ? void 0 : _h.length) === 0,
            x: node.x,
            y: node.y,
            angle: node.angle,
            data: {
                name: (_j = node.name) !== null && _j !== void 0 ? _j : '',
                value: (_k = node.length) !== null && _k !== void 0 ? _k : 0
            },
            branchset: (_l = node.branchset) !== null && _l !== void 0 ? _l : []
        };
        // Recursively convert children
        if (node.branchset) {
            unrootedNode.children = node.branchset.map(function (child) {
                var convertedChild = convertNode(child);
                convertedChild.parent = unrootedNode;
                df.push(convertedChild);
                return convertedChild;
            });
        }
        return unrootedNode;
    }
    // Start conversion from root
    var rootNode = convertNode(tree);
    df.push(rootNode);
    if (sort) {
        df = df.sort(function (a, b) {
            return a.thisId - b.thisId;
        });
    }
    return (df);
}
/**
 * Count the number of tips that descend from this node
 */
function numTips(thisnode) {
    var result = 0;
    for (var _i = 0, _a = levelorder(thisnode); _i < _a.length; _i++) {
        var node = _a[_i];
        if (node.branchset.length === 0)
            result++;
    }
    return (result);
}
/**
 * Recursive function for breadth-first search of a tree
 * the root node is visited first.
 */
function levelorder(root) {
    // aka breadth-first search
    var queue = [root], result = [], curnode;
    while (queue.length > 0) {
        curnode = queue.pop();
        if (curnode) {
            result.push(curnode);
            for (var _i = 0, _a = curnode.branchset; _i < _a.length; _i++) {
                var child = _a[_i];
                queue.push(child);
            }
        }
    }
    return (result);
}
function equalAngleLayout(node) {
    var _a, _b;
    // Cast node to EqAngNode to add required properties
    var eqNode = node;
    if (eqNode.parent === null) {
        // node is root
        eqNode.start = 0.; // guarantees no arcs overlap 0
        eqNode.end = 2.; // *pi
        eqNode.angle = 0.; // irrelevant
        eqNode.ntips = numTips(eqNode);
        eqNode.x = 0;
        eqNode.y = 0;
    }
    var child, arc, lastStart = eqNode.start;
    for (var i = 0; i < eqNode.branchset.length; i++) {
        // the child of the current node
        child = eqNode.branchset[i];
        // the number of tips the child node has
        child.ntips = numTips(child);
        // assign proportion of arc to this child
        arc = (eqNode.end - eqNode.start) * child.ntips / eqNode.ntips;
        child.start = lastStart;
        child.end = child.start + arc;
        // bisect the arc
        child.angle = child.start + (child.end - child.start) / 2.;
        lastStart = child.end;
        // map to coordinates
        child.x = eqNode.x + ((_a = child.length) !== null && _a !== void 0 ? _a : 0) * Math.sin(child.angle * Math.PI);
        child.y = eqNode.y + ((_b = child.length) !== null && _b !== void 0 ? _b : 0) * Math.cos(child.angle * Math.PI);
        // climb up
        equalAngleLayout(child);
    }
    // had to add this!
    return eqNode;
}

// Tree Components
function add(a, b) {
    return a + b;
}

exports.RadialTree = RadialTree;
exports.RectTree = RectTree;
exports.UnrootedTree = UnrootedTree;
exports.add = add;
exports.selectAllLeaves = selectAllLeaves;
exports.selectAllNodes = selectAllNodes;
//# sourceMappingURL=index.cjs.map
