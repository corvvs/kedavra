import pickle
import numpy as np

from logistic_regression import LogisticRegression
from scaler import MinMaxScaler


class Model:
    def __init__(self, scaler=MinMaxScaler(), learning_rate=1):
        self.model = {
            'Slytherin': LogisticRegression(learning_rate=learning_rate),
            'Gryffindor': LogisticRegression(learning_rate=learning_rate),
            'Ravenclaw': LogisticRegression(learning_rate=learning_rate),
            'Hufflepuff': LogisticRegression(learning_rate=learning_rate),
        }
        self.scaler = scaler
        self.learning_rate = learning_rate


    def preprocess(self, df):
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

        # 欠損値処理
        df = df.dropna()

        # データのnumpy化
        y = df['Hogwarts House'].values
        x = df[column_x].values

        return x, y


    def train(self, x, y, epoch=100, verbose=False, seed=None):
        self.scaler.fit(x)
        x = self._convert_x(x)
        for key, model in self.model.items():
            map_func = lambda x: 1 if x == key else 0
            y_map = np.vectorize(map_func)(y)
            model.train(x, y_map, epoch=epoch, verbose=verbose, seed=seed)


    def predict(self, x):
        x = self._convert_x(x)
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
            {key: model.dump() for key, model in self.model.items()}
        ]
        with open(file, 'wb') as p:
            pickle.dump(data, p)


    def load(self, file='data.pickle'):
        with open(file, mode='rb') as f:
            s = pickle.load(f)
            self.scaler.load(s[0])
            for key, weight in s[1].items():
                self.model[key].load(weight)


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
