

#![allow(dead_code)]
#![allow(stable_features)]

extern crate proc_macro;

#[macro_use]
extern crate syn;

#[macro_use]
extern crate quote;

mod utils;
use utils::*;

#[proc_macro_attribute]
pub fn contract(
    _args: proc_macro::TokenStream,
    input: proc_macro::TokenStream,
) -> proc_macro::TokenStream {
    let contract = Contract::new(&parse_macro_input!(input as syn::ItemTrait));

    // let contract_struct = contract.struct_name;
    // let trait_name = contract.trait_name;
    // let method_sigs = contract.method_sigs;
    // let method_impls = contract.method_impls;
    let endpoints = contract.endpoints;

    proc_macro::TokenStream::from(quote! {
      use elrond_wasm;
      use elrond_wasm::BigInt;
      use elrond_wasm::Address;
      use elrond_wasm::StorageKey;

      // pub trait #trait_name {
      //   #(#method_sigs)*
      // }

      // pub struct #contract_struct;

      // impl #trait_name for #contract_struct {
      //   #(#method_impls)*
      // }

      #(#endpoints)*
    })
}
