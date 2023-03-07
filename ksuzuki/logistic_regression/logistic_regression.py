import pickle
import numpy as np

from utility import sigmoid


class LogisticRegression:
    def __init__(self, weight=None, learning_rate=1):
        self.weight = weight
        self.learning_rate = learning_rate


    def predict(self, x):
        return np.where(self._net_out(x) > 0, 1, 0)


    def predict_proba(self, x):
        return self._activation(self._net_out(x))


    def train(self, x, y, epoch=100, verbose=False, seed=None):
        if len(x) != len(y):
            raise RuntimeError("len(x) != len(y)")
        if len(x) == 0:
            raise RuntimeError("len(x) == 0")
        if epoch < 1:
            raise RuntimeError("epoch < 1")
        if self.weight is None:
            self._init_weight(x, seed)

        for i in range(epoch):
            self._gradient_descent(x, y)
            if verbose:
                print("{}/{}: weight: {}".format(i, epoch, self.weight))


    def dump(self):
        return self.weight


    def load(self, weight):
        self.weight = weight


    def _gradient_descent(self, x, y):
        # delta_weight = (pred_prod - y)x
        # weight -= learning_rate * delta_weight
        pred_prod = self._activation(self._net_out(x))
        errors = pred_prod - y
        self.weight[0] -= self.learning_rate * errors.sum()
        self.weight[1:] -= self.learning_rate * x.T.dot(errors)


    def _net_out(self, x):
        return np.dot(x, self.weight[1:]) + self.weight[0]


    def _activation(self, x):
        return sigmoid(x)


    def _init_weight(self, x, seed=None):
        rgen = np.random.RandomState(seed)
        self.weight = rgen.normal(loc=0.0, scale=0.1, size=1+x.shape[1])
