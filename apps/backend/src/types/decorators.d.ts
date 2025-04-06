// Fix for decorator compatibility with TypeScript 5.8+
import 'reflect-metadata';

declare global {
  interface ClassDecorator {
    <TFunction extends Function>(target: TFunction): TFunction | void;
  }

  interface PropertyDecorator {
    (target: Object, propertyKey: string | symbol): void;
  }

  interface MethodDecorator {
    <T>(target: Object, propertyKey: string | symbol, descriptor: TypedPropertyDescriptor<T>): TypedPropertyDescriptor<T> | void;
  }

  interface ParameterDecorator {
    (target: Object, propertyKey: string | symbol, parameterIndex: number): void;
  }
}
