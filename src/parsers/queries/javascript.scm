; JavaScript/TypeScript Tree-sitter queries

; Function declarations
(function_declaration
  name: (identifier) @function.name
  parameters: (formal_parameters) @function.params
  body: (statement_block) @function.body) @function.def

; Arrow functions
(variable_declarator
  name: (identifier) @function.name
  value: (arrow_function
    parameters: (formal_parameters) @function.params
    body: (_) @function.body)) @function.arrow

; Class declarations
(class_declaration
  name: (identifier) @class.name
  superClass: (identifier)? @class.extends
  body: (class_body) @class.body) @class.def

; Method definitions
(method_definition
  name: (property_name) @method.name
  value: (function_expression) @method.body) @method.def

; Import statements
(import_statement
  source: (string) @import.source) @import.def

; Export statements
(export_statement) @export.def

; JSX elements (for React)
(jsx_element
  open_tag: (jsx_opening_element
    name: (jsx_identifier) @jsx.tag)) @jsx.element
