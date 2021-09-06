import { makeLetExp, DefineExp, makeDefineExp, makeProgram, VarDecl, isExp, ClassExp, Binding, CExp, ProcExp, Exp, Program,  AppExp, makeAppExp, makeBinding, makeBoolExp, makeIfExp, makePrimOp, makeProcExp, makeStrExp, makeVarDecl, makeVarRef, isProcExp
,isStrExp, isAppExp, isAtomicExp, isCExp, isClassExp, isVarDecl, isBinding, isBoolExp, isNumExp, isLetExp, isLitExp, isVarRef, isIfExp, isPrimOp, isDefineExp, isProgram  } from "./L31-ast";
import { Result, makeOk, makeFailure, bind, mapResult, safe2, safe3, isOk } from "../shared/result";
import { map, zipWith } from "ramda";
import { } from "../imp/L3-ast";


//Purpose: Transform ClassExp to ProcExp
//Signature: for2proc(classExp)
//Type: ClassExp => ProcExp

export const class2proc = (exp: ClassExp): ProcExp =>
    makeProcExp(exp.fields, [makeProcExp([makeVarDecl('msg')],[recursiveIfExp(exp.methods, 0)])]);

const recursiveIfExp: (methods: Binding[], index: number) => CExp = (methods: Binding[], index: number): CExp =>
    index === methods.length ? makeBoolExp(false) :
    makeIfExp(
        makeAppExp(makePrimOp("eq?"), [makeVarRef('msg'), makeStrExp("'" + methods[index].var.var)]),
        makeAppExp(methods[index].val, []),
        recursiveIfExp(methods, index+1)
    )


//Purpose: Transform L31 AST to L3 AST
//Signature: l31ToL3(l31AST)
//Type: [Exp | Program] => Result<Exp | Program>

const L31ToL3Exp = (exp: Exp | Program): Result<Exp> =>
isDefineExp(exp) ? L31ToL3DefineExp(exp) :
isCExp(exp) ? L31ToL3CExp(exp) :
makeFailure("Invalid L31 Program!");

const L31ToL3DefineExp = (exp: DefineExp): Result<DefineExp> =>
bind(L31ToL3CExp(exp.val), (val: CExp) => makeOk(makeDefineExp(exp.var, val)));

const L31ToL3CExp = (exp: CExp): Result<CExp> =>
isBoolExp(exp) ? makeOk(exp) :
isNumExp(exp) ? makeOk(exp) :
isStrExp(exp) ? makeOk(exp) :
isLitExp(exp) ? makeOk(exp) :
isVarRef(exp) ? makeOk(exp) :
isPrimOp(exp) ? makeOk(exp) :
isProcExp(exp) ? bind(mapResult(L31ToL3CExp, exp.body), (body: CExp[]) => makeOk(makeProcExp(exp.args, body))) :
isIfExp(exp) ? safe3((test: CExp, then: CExp, alt: CExp) => makeOk(makeIfExp(test, then, alt))) (L31ToL3CExp(exp.test), L31ToL3CExp(exp.then), L31ToL3CExp(exp.alt)) :
isAppExp(exp) ? safe2((rator: CExp, rands: CExp[]) => makeOk(makeAppExp(rator, rands))) (L31ToL3CExp(exp.rator), mapResult(L31ToL3CExp, exp.rands)) :
isLetExp(exp) ? safe2((bindings: Binding[], body: CExp[]) => makeOk(makeLetExp(bindings, body))) (bind(mapResult(L31ToL3CExp, map((b: Binding) => b.val, exp.bindings)), (vals: CExp[]) => makeOk(zipWith(makeBinding, map((b: Binding) => b.var.var, exp.bindings), vals))), mapResult(L31ToL3CExp, exp.body)) :
isClassExp(exp) ? L31ToL3CExp(class2proc(exp)) :
makeFailure("Invalid L31 Program!");

export const L31ToL3 = (exp: Exp | Program): Result<Exp | Program> =>
isProgram(exp) ? bind(mapResult(L31ToL3Exp, exp.exps), (exps: Exp[]) => makeOk(makeProgram(exps))) :
isExp(exp) ? L31ToL3Exp(exp) :
makeFailure("Invalid L31 Program!");