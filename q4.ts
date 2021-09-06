import { makeLetExp, DefineExp, makeDefineExp, makeProgram, VarDecl, isExp, ClassExp, Binding, CExp, ProcExp, Exp, Program,  AppExp, makeAppExp, makeBinding, makeBoolExp, makeIfExp, makePrimOp, makeProcExp, makeStrExp, makeVarDecl, makeVarRef, isProcExp
    ,isStrExp, isAppExp, isAtomicExp, isCExp, isClassExp, isVarDecl, isBinding, isBoolExp, isNumExp, isLetExp, isLitExp, isVarRef, isIfExp, isPrimOp, isDefineExp, isProgram  } from "./L31-ast";
    import { Result, makeOk, makeFailure, bind, mapResult, safe2, safe3, isOk } from "../shared/result";
    import { map, zipWith } from "ramda";
    import { makeEmptySExp, makeSymbolSExp, SExpValue, makeCompoundSExp, valueToString } from '../imp/L3-value'
import { PrimOp } from "../imp/L3-ast";

/*
Purpose: Transform L2 AST to Python program string
Signature: l2ToPython(l2AST)
Type: [EXP | Program] => Result<string>
*/
export const l2ToPython = (exp: Exp | Program): Result<string>  => 
    isBoolExp(exp) ? (exp.val ? makeOk("True") : makeOk("False") ):
    isNumExp(exp) ? makeOk(valueToString(exp.val)) :
    isStrExp(exp) ? makeOk(exp.val) :
    isVarRef(exp) ? makeOk(exp.var) :
    isProcExp(exp) ? bind(l2ToPython(exp.body[0]), (str: string) => makeOk(`(lambda ${map((v: VarDecl) => v.var, exp.args).join(',')} : ${str})`)):
    isIfExp(exp) ? safe3((then: string, test: string, alt: string) => makeOk(`(${then} if ${test} else ${alt})`)) (l2ToPython(exp.then), l2ToPython(exp.test), l2ToPython(exp.alt)) :
    isAppExp(exp) ? (isIfExp(exp.rator) || (isPrimOp(exp.rator) && !isLambdaOperator(exp.rator)) ?
                    (isPrimOp(exp.rator) && exp.rator.op) === 'not' ?
                    bind(l2ToPython(exp.rands[0]), (str: string) => makeOk(`(not ${str})`)) : 
                    safe2((rator: string, rands: string[]) => makeOk(`(${rands.join(` ${rator} `)})`)) (l2ToPython(exp.rator), mapResult(l2ToPython, exp.rands)) :
                    safe2((rator: string, rands: string[]) => makeOk(`${rator}(${rands.join(`,`)})`)) (l2ToPython(exp.rator), mapResult(l2ToPython, exp.rands))) :
    isPrimOp(exp) ? l2ToPythonPrimOp(exp) :
    isDefineExp(exp) ? bind(l2ToPython(exp.val), (str: string) => makeOk(`${exp.var.var} = ${str}`)) :
    isProgram(exp) ? bind(mapResult(l2ToPython, exp.exps), (arr: string[]) => makeOk(arr.join('\n'))) :
    makeFailure("Invalid l2 program!");

const l2ToPythonPrimOp = (exp: PrimOp): Result<string> =>
    exp.op === '+' ? makeOk('+') :
    exp.op === '-' ? makeOk('-') :
    exp.op === '/' ? makeOk('/') :
    exp.op === '*' ? makeOk('*') :
    exp.op === '>' ? makeOk('>') :
    exp.op === '<' ? makeOk('<') :
    exp.op === '=' ? makeOk('==') :
    exp.op === 'boolean?' ? makeOk('(lambda x : (type(x) == bool)') :
    exp.op === 'number?' ? makeOk('(lambda x : (type(x) == int or type(x) == float))') :
    exp.op === 'eq?' ? makeOk('==') :
    exp.op === 'and' ? makeOk('and') :
    exp.op === 'or' ? makeOk('or') :
    exp.op === 'not' ? makeOk('not') :
    makeFailure("Primitive operator was not valid"); 

const isLambdaOperator = (op: PrimOp): boolean => (op.op === 'boolean?' || op.op === 'number?');

