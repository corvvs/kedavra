import numpy as np


def sigmoid(x):
    sigmoid_range = 100
    return 1 / (1 + np.exp(-np.clip(x, -sigmoid_range, sigmoid_range)))


def train_test_split(x, y, test_size=0.1, random_state=None):
    rgen = np.random.RandomState(random_state)
    size = int(len(y) * test_size)
    indexes = rgen.choice(len(y), size=size, replace=None)
    x_test = x[indexes]
    y_test = y[indexes]
    x_train = np.delete(x, indexes, 0)
    y_train = np.delete(y, indexes)
    return x_train, x_test, y_train, y_test


def mean(x):
    if len(x) == 0:
        return 0
    return sum(x) / len(x)
