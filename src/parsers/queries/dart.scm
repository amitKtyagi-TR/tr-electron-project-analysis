; Dart Tree-sitter queries (for Flutter)

; Class declarations
(class_definition
  name: (identifier) @class.name
  superclass: (type_name)? @class.extends
  body: (class_body) @class.body) @class.def

; Method declarations
(method_declaration
  name: (identifier) @method.name
  parameters: (formal_parameter_list) @method.params
  body: (block) @method.body) @method.def

; Widget classes (Flutter-specific)
(class_definition
  name: (identifier) @widget.name
  superclass: (type_name) @widget.extends
  body: (class_body) @widget.body) @widget.def
  (#match? @widget.extends ".*Widget.*")

; Build methods (Flutter-specific)
(method_declaration
  name: (identifier) @build.method
  return_type: (type_name) @build.return_type
  body: (block) @build.body) @build.def
  (#eq? @build.method "build")

; Import statements
(import_specification
  uri: (string_literal) @import.uri) @import.def

; Library declarations
(library_name
  name: (dotted_identifier) @library.name) @library.def
