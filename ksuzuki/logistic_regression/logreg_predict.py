import argparse
import pandas as pd
import numpy as np

from model import Model


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('data_pass')
    parser.add_argument('--weight_pass', default='data.pickle')

    args = parser.parse_args()

    df = pd.read_csv(args.data_pass, index_col=0)

    model = Model()
    x, y = model.preprocess(df)
    model.load(args.weight_pass)

    pred = model.predict(x)
    print('test: {} / {}: {}'.format(sum(y == pred), len(y), sum(y == pred) / len(y)))

    df = pd.DataFrame(np.array([np.arange(len(pred)), pred]).T, columns=['Index', 'Hogwarts House'])
    df.to_csv('houses.csv', index=False)
