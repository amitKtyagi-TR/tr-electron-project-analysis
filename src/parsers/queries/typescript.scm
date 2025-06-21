; TypeScript-specific queries (extends JavaScript)

; Interface declarations
(interface_declaration
  name: (type_identifier) @interface.name
  body: (object_type) @interface.body) @interface.def

; Type aliases
(type_alias_declaration
  name: (type_identifier) @type.name
  value: (_) @type.definition) @type.def

; Generic type parameters
(type_parameters
  (type_parameter
    name: (type_identifier) @generic.name)) @generic.def

; Decorators (for NestJS, Angular, etc.)
(decorator
  (identifier) @decorator.name) @decorator.def

; Method signatures with types
(method_signature
  name: (property_name) @method.name
  parameters: (formal_parameters) @method.params
  return_type: (type_annotation)? @method.return_type) @method.signature
