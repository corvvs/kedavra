import argparse
import pandas as pd
import numpy as np

from utility import train_test_split
from model import Model


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('data_pass')
    parser.add_argument('--test_size', type=float, default=0)
    parser.add_argument('--learning_rate', type=float, default=0.001)
    parser.add_argument('--C', type=float, default=None)
    parser.add_argument('--epoch', type=int, default=100)
    parser.add_argument('--varidation_step', type=int, default=1)
    parser.add_argument('--verbose', type=bool, default=False)

    args = parser.parse_args()

    df = pd.read_csv(args.data_pass, index_col=0)
    model = Model()
    x, y = model.df_preprocess(df)

    if args.test_size != 0:
        print('validation start')
        validation_result = []
        for i in range(args.varidation_step):
            print('varidation: {}/{}'.format(i + 1, args.varidation_step))
            model = Model(learning_rate=args.learning_rate, C=args.C)
            # データの分割
            x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=args.test_size)

            x_train, y_train = model.preprocess(x_train, y_train)
            model.train(x_train, y_train, epoch=args.epoch, verbose=args.verbose)

            pred = model.predict(x_train)
            accuracy_train = sum(y_train == pred) / len(y_train)
            print('train: {} / {}: {}'.format(sum(y_train == pred), len(y_train), accuracy_train))

            x_test, y_test = model.preprocess(x_test, y_test, is_train=False)

            pred = model.predict(x_test)
            accuracy_test = sum(y_test == pred) / len(y_test)
            print('test: {} / {}: {}'.format(sum(y_test == pred), len(y_test), accuracy_test))
            validation_result.append([accuracy_train, accuracy_test])
        if args.varidation_step > 1:
            acc = np.mean(validation_result, axis=0)
            print('result:')
            print('accuracy train mean: {}'.format(acc[0]))
            print('accuracy test mean: {}'.format(acc[1]))

    model = Model(learning_rate=args.learning_rate)
    x, y = model.preprocess(x, y)
    model.train(x, y, epoch=args.epoch, verbose=args.verbose)
    model.dump()
