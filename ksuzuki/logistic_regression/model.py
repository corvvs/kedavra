import pickle
import numpy as np

from logistic_regression import LogisticRegression
from scaler import MinMaxScaler
from utility import mean


class Model:
    def __init__(self, scaler=MinMaxScaler(), learning_rate=1, C=None):
        self.model = {
            'Slytherin': LogisticRegression(learning_rate=learning_rate, C=C),
            'Gryffindor': LogisticRegression(learning_rate=learning_rate, C=C),
            'Ravenclaw': LogisticRegression(learning_rate=learning_rate, C=C),
            'Hufflepuff': LogisticRegression(learning_rate=learning_rate, C=C),
        }
        self.scaler = scaler
        self.learning_rate = learning_rate
        self.data_means = None


    def df_preprocess(self, df):
        # 必要なcolumnのみ取得
        column_y = ['Hogwarts House']
        # column_x = ['Astronomy', 'Muggle Studies']
        # column_x = ['Arithmancy', 'Astronomy', 'Herbology', 'Defense Against the Dark Arts',
        #    'Divination', 'Muggle Studies', 'Ancient Runes', 'History of Magic',
        #    'Transfiguration', 'Potions', 'Care of Magical Creatures', 'Charms',
        #    'Flying']
        column_x = ['Arithmancy', 'Astronomy', 'Herbology',
           'Divination', 'Muggle Studies', 'Ancient Runes', 'History of Magic',
           'Transfiguration', 'Potions', 'Care of Magical Creatures', 'Charms',
           'Flying']
        df = df[column_y + column_x]

        # データのnumpy化
        y = df['Hogwarts House'].values
        x = df[column_x].values

        return x, y


    def preprocess(self, x, y, is_train=True):
        if is_train:
            # 欠損値の削除
            # delete_indexes = []
            # for i in range(x.shape[0]):
            #     if any(np.isnan(x[i])):
            #         delete_indexes.append(i)
            # x = np.delete(x, delete_indexes, 0)
            # y = np.delete(y, delete_indexes, 0)
            # 欠損値補間のための準備
            self.data_means = []
            for i in range(x.shape[1]):
                sample = x[:, i][~np.isnan(x[:, i])]
                self.data_means.append(mean(sample))
        # 欠損値補間
        for i in range(x.shape[1]):
            x[:, i][np.isnan(x[:, i])] = self.data_means[i]

        # スケーリング
        if is_train:
            self.scaler.fit(x)
        x = self._convert_x(x)
        return x, y


    def train(self, x, y, epoch=100, verbose=False, seed=None):
        # self.scaler.fit(x)
        # x = self._convert_x(x)
        for key, model in self.model.items():
            map_func = lambda x: 1 if x == key else 0
            y_map = np.vectorize(map_func)(y)
            model.train(x, y_map, epoch=epoch, verbose=verbose, seed=seed)


    def predict(self, x):
        # x = self._convert_x(x)
        pred_list = [[], [], [], []]
        map_dict = {
            'Slytherin': 0,
            'Gryffindor': 1,
            'Ravenclaw': 2,
            'Hufflepuff': 3,
        }
        for key, model in self.model.items():
            pred_list[map_dict[key]] = [model.predict_proba(x)]
        pred_list = np.argmax(pred_list, axis=0)[0]
        return self._convert_y(pred_list)


    def dump(self, file='data.pickle'):
        data = [
            self.scaler.dump(),
            {key: model.dump() for key, model in self.model.items()},
            self.data_means
        ]
        print(data)
        with open(file, 'wb') as p:
            pickle.dump(data, p)


    def load(self, file='data.pickle'):
        with open(file, mode='rb') as f:
            s = pickle.load(f)
            self.scaler.load(s[0])
            for key, weight in s[1].items():
                self.model[key].load(weight)
            self.data_means = s[2]


    def _convert_y_reverse(self, y):
        map_dict = {
            'Slytherin': 0,
            'Gryffindor': 1,
            'Ravenclaw': 2,
            'Hufflepuff': 3,
        }
        return np.vectorize(map_dict.get)(y)


    def _convert_y(self, y):
        map_dict = {
            0: 'Slytherin',
            1: 'Gryffindor',
            2: 'Ravenclaw',
            3: 'Hufflepuff',
        }
        return np.vectorize(map_dict.get)(y)


    def _convert_x(self, x):
        return self.scaler.predict(x)
