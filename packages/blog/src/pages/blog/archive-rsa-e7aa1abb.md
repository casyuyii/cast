---
title: "RSA"
topics: ["Archive", "Programming"]
archived: true
sourceUrl: "https://www.notion.so/e7aa1abb2828458483beac4dd99a329d"
---

(Rivest–Shamir–Adleman) he acronym RSA comes from the surnames of Ron Rivest, Adi Shamir, and Leonard Adleman, who publicly described the algorithm in 1977.

所以如果有人问你 RSA 的全称是什么, 那他肯定是在钓鱼.

我之前有写过相关的笔记. 但是搞丢了. 再简单写一遍, 就当重温了.

![](https://imgur.com/aDQhYTB.png)

RSA 包含一个公钥和一个私钥. 公钥可以公开, 用于加密. 仅能被私钥解密. 

1. 选择两个不同的质数. p 和 q. 保持其私密性.
2. 计算 n = pq. (n 是公钥和私钥的模)
3. 计算欧拉函数: phi(n) : phi(n) = (p - 1)(q - 1)
4. 选择一个数 e : 1 < e < phi(n) 并且 e 和 phi(n) 互质. (e 是公钥的指数)
5. 计算 d. de 满足与 1 同余 phi(n). de = 1 + x * phi(n). (d 被当作私钥指数)

(PS: phi(n) 为 1 ~ n 中与 n 互质的数字的数量(不包含 n)

而 lambda(n) 则是 1 ~ n 中所有和 n 互质的数字的次方满足其值 = 1 + xn. 

lambda(n) 相对难懂一些. 比如 lambda(7) = 6. phi(7) = {1, 2, 3, 4, 5, 6}

pow(1, 6) = 1(1 + 0 * 7) → mod 7 = 1

pow(2, 6) = 64(1 + 9 * 7) → mod 7 = 1

pow(3, 6) = 729(1 + 14 * 7) → mod 7 = 1

pow(4, 6) = ...

pow(6, 6) = 46656(1 + 6665 * 7) → mod 7 = 1

幂为 6. 所以 lambda(n) = 6. 如果 n 可以分为两个不同的质数相乘. 就如同上面的 n = pq. 则还有一个规律为: 

lambda(n) = lcm(p - 1, q - 1) 

比如 lambda(15) = ? 可由 3 * 5 = 15 → lcm(2, 4) = 4 → lambda(15) = 4 得知.

(所以说我对数学的感觉很别扭, 一方面它的确有趣, 一方面备受打击, 有了问题又无从问起. 因为很多事情知其然而不知其所以然. 就比如我不知道这些公式为什么成立, 也没找到是用什么过程去证明其存在的合理性. 我想要的是知道其存在后发现其存在, 而不是发现其存在后反证其存在. 问题的解答方法不应建设在答案之上)

注意在以上步骤中:

- step1: Numbers can be probabilistically tested for primality.
- step3: 在 [PSCK](https://en.wikipedia.org/wiki/PKCS_1) 中由 phi(n) 改变为 lambda(n) = lcm(p - 1, q - 1)
- step4: 比较流行的 e 的值为 65537 = pow(2, 16) + 1. 一些软件选择更小的, 如: 3, 5, 35 代替. 使计算速度更快.
- step4, step5: 可以和 [extended Euclidean algorithm](https://en.wikipedia.org/wiki/Extended_Euclidean_algorithm) 算法执行. 参见 [modular algorithm](https://simple.wikipedia.org/wiki/Modular_arithmetic)

案例:

1. p = 61, q = 53
2. n = p * q = 3233
3. phi(n) = (p - 1) * (q - 1) = 3120
4. e = 17
5. d = 2753, 2753 * 17 = 46801 = 1 + 15 * phi(n)

假设加密数字为 123.

encrypt: c = pow(123, 17) mod 3233 = 855

decrypt: m = pow(855, 2753) mod 3233 = 123

有一个比较清晰表示关系的公式:

```cpp
pow( (pow(m, a) mod n), b) mod n = pow ( (pow(m, b) mod n), a) mod n

m 的 a 次方 mod n 的结果的 b 次方 mod n = 

m 的 b 次方 mod n 的结果的 a 次方 mod n
```

 $(m ^ a \% n) ^b \% n = (m ^ b \% n) ^a \%n = m$

将 a, b 对换, 等式成立. 

这里可以参照一下 ssh-keygen 生成后的文件. 我找到了 [PKCS](https://www.ietf.org/rfc/rfc3447.txt) (public-key cryptography standards)

```cpp
A.1.1 RSA public key syntax

   An RSA public key should be represented with the ASN.1 type
   RSAPublicKey:

      RSAPublicKey ::= SEQUENCE {
          modulus           INTEGER,  -- n
          publicExponent    INTEGER   -- e
      }

   The fields of type RSAPublicKey have the following meanings:

    * modulus is the RSA modulus n.

    * publicExponent is the RSA public exponent e.

A.1.2 RSA private key syntax

   An RSA private key should be represented with the ASN.1 type
   RSAPrivateKey:

      RSAPrivateKey ::= SEQUENCE {
          version           Version,
          modulus           INTEGER,  -- n
          publicExponent    INTEGER,  -- e
          privateExponent   INTEGER,  -- d
          prime1            INTEGER,  -- p
          prime2            INTEGER,  -- q
          exponent1         INTEGER,  -- d mod (p-1)
          exponent2         INTEGER,  -- d mod (q-1)
          coefficient       INTEGER,  -- (inverse of q) mod p
          otherPrimeInfos   OtherPrimeInfos OPTIONAL
      }

   The fields of type RSAPrivateKey have the following meanings:

    * version is the version number, for compatibility with future
      revisions of this document.  It shall be 0 for this version of the
      document, unless multi-prime is used, in which case it shall be 1.

            Version ::= INTEGER { two-prime(0), multi(1) }
               (CONSTRAINED BY
               {-- version must be multi if otherPrimeInfos present --})

    * modulus is the RSA modulus n.

    * publicExponent is the RSA public exponent e.

    * privateExponent is the RSA private exponent d.

    * prime1 is the prime factor p of n.

    * prime2 is the prime factor q of n.

    * exponent1 is d mod (p - 1).

    * exponent2 is d mod (q - 1).

    * coefficient is the CRT coefficient q^(-1) mod p.

    * otherPrimeInfos contains the information for the additional primes
      r_3, ..., r_u, in order.  It shall be omitted if version is 0 and
      shall contain at least one instance of OtherPrimeInfo if version
      is 1.
```

文档描述了公钥和私钥的结构. 可以看到, 私钥拥有全部的数据. 而公钥仅包含 n 和 e.

这里贴一下 [RFC](https://tools.ietf.org/html/) . 或许以后还会查询相关的文档.
