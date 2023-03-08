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
    model.load(args.weight_pass)

    x, y = model.df_preprocess(df)
    x, y = model.preprocess(x, y, is_train=False)

    pred = model.predict(x)
    df = pd.DataFrame(np.array([np.arange(len(pred)), pred]).T, columns=['Index', 'Hogwarts House'])
    df.to_csv('houses.csv', index=False)
