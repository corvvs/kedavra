import pickle
import numpy as np

from utility import sigmoid


class LogisticRegression:
    def __init__(self, weight=None, learning_rate=1, C=None):
        self.weight = weight
        self.learning_rate = learning_rate
        self.C = C


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
            # self._gradient_descent(x, y)
            # self._sgd(x, y, seed)
            self._mini_batch_sgd(x, y, 16, seed)
            if verbose:
                print("{}/{}: weight: {}".format(i, epoch, self.weight))


    def dump(self):
        return self.weight


    def load(self, weight):
        self.weight = weight


    def _gradient_descent(self, x, y):
        # delta_weight = (pred_prod - y)x
        # weight -= learning_rate * (C * delta_weight + weight)
        pred_prod = self._activation(self._net_out(x))
        errors = pred_prod - y
        if self.C is None:
            grad = np.array((
                errors.sum(),
                *(x.T.dot(errors))
            ))
        else:
            grad = np.array((
                self.C * errors.sum(),
                *(self.C * x.T.dot(errors) + np.abs(self.weight[1:]))
            ))
        self.weight -= self.learning_rate * grad


    def _sgd(self, x, y, seed):
        if not hasattr(self, 'sgd_rgen'):
            self.sgd_rgen = np.random.RandomState(seed)
        indexes = self.sgd_rgen.choice(len(y), size=len(y), replace=None)
        x_random = x[indexes]
        y_random = y[indexes]
        for i in range(len(y_random)):
            self._gradient_descent(np.array((x_random[i],)), np.array((y_random[i],)))


    def _mini_batch_sgd(self, x, y, batch_size, seed):
        if not hasattr(self, 'mb_sgd_rgen'):
            self.mb_sgd_rgen = np.random.RandomState(seed)
        indexes = self.mb_sgd_rgen.choice(len(y), size=len(y), replace=None)
        x_random = x[indexes]
        y_random = y[indexes]
        for i in range(len(y_random) // batch_size):
            start = i * batch_size
            end = (i + 1) * batch_size
            self._gradient_descent(x_random[start: end], y_random[start: end])
        if len(y_random) & batch_size != 0:
            start = (len(y_random) // batch_size) * batch_size
            self._gradient_descent(x_random[start:], y_random[start:])


    def _net_out(self, x):
        return np.dot(x, self.weight[1:]) + self.weight[0]


    def _activation(self, x):
        return sigmoid(x)


    def _init_weight(self, x, seed=None):
        rgen = np.random.RandomState(seed)
        self.weight = rgen.normal(loc=0.0, scale=0.1, size=1+x.shape[1])
