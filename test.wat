(module $djb2
  (;
    Exports below
  ;)
  (memory (export "memory") 1)

  ;; DJB2 hash function (XOR version)
  ;; This is a modified version that allows one to set the initial hash value
  (func $djb2_xor (export "djb2_xor") (param $primeSeed i32) (param $input.ptr i32) (param $input.end i32) (result i32)
    (local $hash i32 (get_local $primeSeed))
    (block $break
      (loop $continue
        (br_if $break (i32.eq (get_local $input.ptr) (get_local $input.end)))

        (set_local $hash
          (i32.add (get_local $hash)
                   (i32.xor (i32.load8_u (get_local $input.ptr))
                            (i32.shl (get_local $hash) (i32.const 5)))))

        (set_local $input.ptr (i32.add (get_local $input.ptr) (i32.const 1)))
        (br $continue)
      )
    )

    (get_local $hash)
  )
)
