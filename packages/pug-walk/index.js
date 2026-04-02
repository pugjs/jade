'use strict';

module.exports = walkAST;
function walkAST(ast, before, after, options) {
  if (after && typeof after === 'object' && typeof options === 'undefined') {
    options = after;
    after = null;
  }
  options = options || {includeDependencies: false};
  var parents = (options.parents = options.parents || []);

  var replace = function replace(replacement) {
    if (Array.isArray(replacement) && !replace.arrayAllowed) {
      throw new Error(
        'replace() can only be called with an array if the last parent is a Block or NamedBlock'
      );
    }
    ast = replacement;
  };
  replace.arrayAllowed =
    parents[0] &&
    (/^(Named)?Block$/.test(parents[0].type) ||
      (parents[0].type === 'RawInclude' && ast.type === 'IncludeFilter'));

  if (before) {
    var result = before(ast, replace);
    if (result === false) {
      result = ast;
      return unsetParent(result)

    } else if (Array.isArray(ast)) {
      // return right here to skip after() call on array
      result = walkAndMergeNodes(ast);
      return unsetParent(result)
    }
  }

  parents.unshift(ast);

  switch (ast.type) {
    case 'NamedBlock':
    case 'Block':
      ast.nodes = walkAndMergeNodes(setParent(ast.nodes, ast));
      break;
    case 'Case':
    case 'Filter':
    case 'Mixin':
    case 'Tag':
    case 'InterpolatedTag':
    case 'When':
    case 'Code':
    case 'While':
      if (ast.block) {
        ast.block = walkAST(setParent(ast.block, ast), before, after, options);
      }
      break;
    case 'Each':
      if (ast.block) {
        ast.block = walkAST(setParent(ast.block, ast), before, after, options);
      }
      if (ast.alternate) {
        ast.alternate = walkAST(setParent(ast.alternate, ast), before, after, options);
      }
      break;
    case 'EachOf':
      if (ast.block) {
        ast.block = walkAST(setParent(ast.block, ast), before, after, options);
      }
      break;
    case 'Conditional':
      if (ast.consequent) {
        ast.consequent = walkAST(setParent(ast.consequent, ast), before, after, options);
      }
      if (ast.alternate) {
        ast.alternate = walkAST(setParent(ast.alternate, ast), before, after, options);
      }
      break;
    case 'Include':
      walkAST(setParent(ast.block, ast), before, after, options);
      walkAST(setParent(ast.file, ast), before, after, options);
      break;
    case 'Extends':
      walkAST(setParent(ast.file, ast), before, after, options);
      break;
    case 'RawInclude':
      ast.filters = walkAndMergeNodes(setParent(ast.filters, ast));
      walkAST(setParent(ast.file, ast), before, after, options);
      break;
    case 'Attrs':
    case 'BlockComment':
    case 'Comment':
    case 'Doctype':
    case 'IncludeFilter':
    case 'MixinBlock':
    case 'YieldBlock':
    case 'Text':
      break;
    case 'FileReference':
      if (options.includeDependencies && ast.ast) {
        walkAST(setParent(ast.ast, ast), before, after, options);
      }
      break;
    default:
      throw new Error('Unexpected node type ' + ast.type);
      break;
  }

  parents.shift();

  after && after(ast, replace);
  return unsetParent(ast);

  function walkAndMergeNodes(nodes) {
    return nodes.reduce(function(nodes, node) {
      var result = walkAST(node, before, after, options);
      if (Array.isArray(result)) {
        return nodes.concat(result);
      } else {
        return nodes.concat([result]);
      }
    }, []);
  }

  function setParent(node, parent) {
    const nodes = node instanceof Array ? node: [node];
    nodes.forEach(function(node) {
      node.parent = parent;
    });
    return node;
  }

  function unsetParent(node) {
    const nodes = node instanceof Array ? node: [node];
    nodes.forEach(function(node) {
      delete node.parent;
    });
    return node;
  }
}

