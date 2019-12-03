
macro_rules! format_ident {
    ($ident:expr, $fstr:expr) => {
        syn::Ident::new(&format!($fstr, $ident), $ident.span())
    };
}

pub struct Contract {
    pub trait_name: proc_macro2::Ident,
    pub struct_name: proc_macro2::Ident,
    pub method_sigs: Vec<proc_macro2::TokenStream>,
    pub method_impls: Vec<proc_macro2::TokenStream>,
    pub endpoints: Vec<proc_macro2::TokenStream>,
}

impl Contract {
    pub fn new(contract_trait: &syn::ItemTrait) -> Self {
        let trait_methods = extract_methods(&contract_trait);
        Contract {
            trait_name: format_ident!(contract_trait.ident, "{}"),
            struct_name: format_ident!(contract_trait.ident, "{}Inst"),
            method_sigs: extract_method_sigs(&trait_methods),
            method_impls: extract_method_impls(&trait_methods),
            endpoints: generate_endpoints(&trait_methods),
        }
    }
}

fn extract_methods(contract_trait: &syn::ItemTrait) -> Vec<&syn::TraitItemMethod> {
    contract_trait
        .items
        .iter()
        .filter_map(|itm| match itm {
            syn::TraitItem::Method(m) => {
                let msig = &m.sig;
                let bad_self_ref = format!(
                    "ABI function `{}` must have `&mut self` as its first argument.",
                    msig.ident.to_string()
                );
                match msig.decl.inputs[0] {
                    syn::FnArg::SelfRef(ref selfref) => {
                        if selfref.mutability.is_none() {
                            panic!(bad_self_ref)
                        }
                    }
                    _ => panic!(bad_self_ref),
                }

                Some(m)
            }
            _ => None,
        }).collect()
}

fn extract_method_sigs(methods: &Vec<&syn::TraitItemMethod>) -> Vec<proc_macro2::TokenStream> {
    methods.iter().map(|m| {
        let mattrs = &m.attrs;
        let msig = &m.sig;
        let sig = quote! {
            #(#mattrs)*
            #msig;
        };
        sig
    }).collect()
}

fn extract_method_impls(methods: &Vec<&syn::TraitItemMethod>) -> Vec<proc_macro2::TokenStream> {
    methods.iter().map(|m| {
        let msig = &m.sig;
        let body = match m.default {
            Some(ref mbody) => {
                quote! { #msig { #mbody } }
            }
            None => quote! {},
        };
        body
    }).collect()
}

fn has_attribute(attrs: &[syn::Attribute], name: &str) -> bool {
	attrs.iter().any(|attr| {
		if let Some(first_seg) = attr.path.segments.first() {
			return first_seg.value().ident == name
		};
		false
	})
}

fn generate_arg_init_snippet(arg: &syn::FnArg, arg_index: isize) -> proc_macro2::TokenStream {
    match arg {
        syn::FnArg::SelfRef(ref selfref) => {
            if selfref.mutability.is_none() || arg_index != -1 {
                panic!("ABI function must have `&mut self` as its first argument.");
            }
            quote!{}
        },
        syn::FnArg::Captured(arg_captured) => {
            let pat = &arg_captured.pat;
            let ty = &arg_captured.ty;
            let arg_index_i32 = arg_index as i32;
            match ty {                
                syn::Type::Path(type_path) => {
                    let type_str = type_path.path.segments.last().unwrap().value().ident.to_string();
                    match type_str.as_str() {
                        "Address" =>
                            quote!{
                                let #pat: Address = elrond_wasm::get_argument_address(#arg_index_i32);
                            },
                        "BigInt" =>
                            quote!{
                                let #pat: BigInt = elrond_wasm::get_argument_big_int(#arg_index_i32);
                            },
                        "i64" =>
                            quote!{
                                let #pat: i64 = elrond_wasm::get_argument_i64(#arg_index_i32);
                            },
                        other_stype_str => {
                            panic!("Unsupported argument type: {:?}", other_stype_str)
                        }
                    }
                },             
                syn::Type::Reference(type_reference) => {
                    if type_reference.mutability != None {
                        panic!("Mutable references not supported as contract method arguments");
                    }
                    match &*type_reference.elem {
                        syn::Type::Path(type_path) => {
                            let type_str = type_path.path.segments.last().unwrap().value().ident.to_string();
                            match type_str.as_str() {
                                "BigInt" =>
                                    quote!{
                                        let #pat = elrond_wasm::get_argument_big_int(#arg_index_i32);
                                    },
                                other_stype_str => {
                                    panic!("Unsupported reference argument type: {:?}", other_stype_str)
                                }
                            }
                        },
                        _ => {
                            panic!("Unsupported reference argument type: {:?}", type_reference)
                        }
                    }
                    
                },
				syn::Type::Tuple(_tuple_type) => 
                    quote!{
                        let #pat: u64 = 0;
                    },
                other_arg => panic!("Unsupported argument type: {:?}", other_arg)
			}
        }
        other_arg => panic!("Unsupported argument type: {:?}", other_arg)
    }
}

fn generate_result_finish_snippet(result_name: &str, ty: &syn::Type) -> proc_macro2::TokenStream {
    let result_ident = syn::Ident::new(result_name, proc_macro2::Span::call_site());
    match ty {                
        syn::Type::Path(type_path) => {
            let type_str = type_path.path.segments.last().unwrap().value().ident.to_string();
            match type_str.as_str() {
                "Address" =>
                    quote!{
                        elrond_wasm::finish(&#result_ident[0], 32);
                    },
                "BigInt" =>
                    quote!{
                        elrond_wasm::finish_big_int(#result_ident);
                    },
                "i64" =>
                    quote!{
                        elrond_wasm::finish_i64(#result_ident);
                    },
                "bool" =>
                    quote!{
                        elrond_wasm::finish_i64( if #result_ident { 1i64 } else { 0i64 });
                    },
                other_stype_str => {
                    panic!("Unsupported argument type: {:?}", other_stype_str)
                }
            }
        },
        other_type => panic!("Unsupported argument type: {:#?}", other_type)
    }
}

fn generate_body_with_result(return_type: &syn::ReturnType, mbody: &syn::Block) -> proc_macro2::TokenStream {
    match return_type.clone() {
        syn::ReturnType::Default => quote!{#mbody},
        syn::ReturnType::Type(_, ty) => {
            match *ty {
                syn::Type::Tuple(_) => {
                    panic!("Tuple result types not yet supported")
                },
                other_ty => {
                    let finish = generate_result_finish_snippet("result", &other_ty);
                    quote!{
                        let result = #mbody;
                        #finish
                    }
                }
            }
        },
    }
}

fn generate_payable_snippet(m: &syn::TraitItemMethod) -> proc_macro2::TokenStream {
    let payable = has_attribute(&m.attrs, "payable");
    if payable {
        quote!{}
    } else {
        quote!{
            if BigInt::compare(&elrond_wasm::get_call_value_big_int(), &BigInt::from_i64(0)) > 0 {
                elrond_wasm::signal_error();
                return;
            } 
        }
    }
}

fn generate_endpoints(methods: &Vec<&syn::TraitItemMethod>) -> Vec<proc_macro2::TokenStream> {
    methods.iter().map(|m| {
        let msig = &m.sig;
        let mut arg_index: isize = -1; // ignore the first argument, which is &mut self
        let arg_init_snippets: Vec<proc_macro2::TokenStream> = 
            msig.decl.inputs
                .iter()
                .map(|arg| {
                    let snippet = generate_arg_init_snippet(arg, arg_index);
                    arg_index=arg_index+1;
                    snippet
                })
                .collect();

        let nr_args = (arg_init_snippets.len() - 1) as i32; // ignore the first argument, which is &mut self

        let payable_snippet = generate_payable_snippet(&m);

        let fn_ident = &msig.ident;
        let body = match m.default {
            Some(ref mbody) => {
                let body_with_result = generate_body_with_result(&msig.decl.output, &mbody);
                quote! { 
                    #[no_mangle]
                    pub fn #fn_ident ()
                    {
                        #payable_snippet
                        if elrond_wasm::get_num_arguments() != #nr_args {
                            elrond_wasm::signal_error();
                            return;
                        }
                        #(#arg_init_snippets)*
                        #body_with_result
                    } 
                }
            }
            None => panic!("Methods without implementation not allowed in contract trait"),
        };
        body
    }).collect()
}

