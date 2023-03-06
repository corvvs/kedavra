import argparse
import pandas as pd
import numpy as np

from utility import train_test_split
from logistic_regression import LogisticRegression
from scaler import MinMaxScaler


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('data_pass')

    args = parser.parse_args()
    print(args.data_pass)

    df = pd.read_csv(args.data_pass, index_col=0)

    # 必要なcolumnのみ取得
    column_y = ['Hogwarts House']
    column_x = ['Astronomy', 'Muggle Studies']
    # column_x = ['Arithmancy', 'Astronomy', 'Herbology', 'Defense Against the Dark Arts',
    #    'Divination', 'Muggle Studies', 'Ancient Runes', 'History of Magic',
    #    'Transfiguration', 'Potions', 'Care of Magical Creatures', 'Charms',
    #    'Flying']
    # column_x = ['Arithmancy', 'Astronomy', 'Herbology',
    #    'Divination', 'Muggle Studies', 'Ancient Runes', 'History of Magic',
    #    'Transfiguration', 'Potions', 'Care of Magical Creatures', 'Charms',
    #    'Flying']
    df = df[column_y + column_x]

    # 欠損値処理
    df = df.dropna()

    # データの整理
    y = df['Hogwarts House'].map({
        'Slytherin': 0,
        'Gryffindor': 1,
        'Ravenclaw': 1,
        'Hufflepuff': 1,
    }).values
    x = df[column_x].values

    # データの分割
    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2)

    # 正規化（Min-Max normalization）
    scaler = MinMaxScaler()
    scaler.fit(x_train)
    x_train = scaler.predict(x_train)
    x_test = scaler.predict(x_test)

    model = LogisticRegression(learning_rate=0.001)
    model.train(x, y, epoch=100, verbose=False)

    pred = model.predict(x_train)
    print('train: {} / {}'.format(sum(1 - np.abs(y_train - pred)), len(y_train)))

    pred = model.predict(x_test)
    print('test: {} / {}'.format(sum(1 - np.abs(y_test - pred)), len(y_test)))
