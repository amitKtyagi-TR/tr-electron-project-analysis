; Python Tree-sitter queries for extracting functions, classes, and imports

; Function definitions
(function_definition
  name: (identifier) @function.name
  parameters: (parameters) @function.params
  body: (block) @function.body) @function.def

; Class definitions
(class_definition
  name: (identifier) @class.name
  superclasses: (argument_list)? @class.bases
  body: (block) @class.body) @class.def

; Import statements
(import_statement
  name: (dotted_name) @import.module) @import.def

(import_from_statement
  module_name: (dotted_name)? @import.module
  name: (dotted_name) @import.name) @import.from

; Decorators
(decorator
  (identifier) @decorator.name) @decorator.def

; Method definitions in classes
(class_definition
  body: (block
    (function_definition
      name: (identifier) @method.name) @method.def))
