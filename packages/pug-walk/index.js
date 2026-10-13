'use strict';

var ownProp = Object.prototype.hasOwnProperty;

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
      return ast;
    } else if (Array.isArray(ast)) {
      // return right here to skip after() call on array
      return walkAndMergeNodes(ast);
    }
  }

  parents.unshift(ast);

  // Use own-property check to prevent prototype pollution gadgets:
  // an attacker could set Object.prototype.type to a node type string,
  // causing arbitrary AST branches to be walked on plain objects.
  var astType = ownProp.call(ast, 'type') ? ast.type : undefined;

  switch (astType) {
    case 'NamedBlock':
    case 'Block':
      ast.nodes = walkAndMergeNodes(ast.nodes);
      break;
    case 'Case':
    case 'Filter':
    case 'Mixin':
    case 'Tag':
    case 'InterpolatedTag':
    case 'When':
    case 'Code':
    case 'While':
      if (ownProp.call(ast, 'block') && ast.block) {
        ast.block = walkAST(ast.block, before, after, options);
      }
      break;
    case 'Each':
      if (ownProp.call(ast, 'block') && ast.block) {
        ast.block = walkAST(ast.block, before, after, options);
      }
      if (ownProp.call(ast, 'alternate') && ast.alternate) {
        ast.alternate = walkAST(ast.alternate, before, after, options);
      }
      break;
    case 'EachOf':
      if (ownProp.call(ast, 'block') && ast.block) {
        ast.block = walkAST(ast.block, before, after, options);
      }
      break;
    case 'Conditional':
      if (ownProp.call(ast, 'consequent') && ast.consequent) {
        ast.consequent = walkAST(ast.consequent, before, after, options);
      }
      if (ownProp.call(ast, 'alternate') && ast.alternate) {
        ast.alternate = walkAST(ast.alternate, before, after, options);
      }
      break;
    case 'Include':
      walkAST(ast.block, before, after, options);
      walkAST(ast.file, before, after, options);
      break;
    case 'Extends':
      walkAST(ast.file, before, after, options);
      break;
    case 'RawInclude':
      ast.filters = walkAndMergeNodes(ast.filters);
      walkAST(ast.file, before, after, options);
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
      if (options.includeDependencies && ownProp.call(ast, 'ast') && ast.ast) {
        walkAST(ast.ast, before, after, options);
      }
      break;
    default:
      throw new Error('Unexpected node type ' + ast.type);
      break;
  }

  parents.shift();

  after && after(ast, replace);
  return ast;

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
}
