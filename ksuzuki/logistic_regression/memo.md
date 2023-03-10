# memo

## ロジスティック回帰について

- シグモイド関数：https://www.kamishima.net/mlmpyja/lr/sigmoid.html
- 最適化アルゴリズムについて：https://qiita.com/omiita/items/1735c1d048fe5f611f80
- sklearnのlogistic regression: https://scikit-learn.org/stable/modules/generated/sklearn.linear_model.LogisticRegression.html
- logistic regressionの更新：https://blog.kazuya.co/machine%20learning/2014/04/28/Logistic-Regression-Algorithm.html
- 正則化について：https://www.yakupro.info/entry/ml-logisticregression1
- 最適化アルゴリズム：https://qiita.com/omiita/items/1735c1d048fe5f611f80

## 環境構築

- venvについて：https://milestone-of-se.nesuke.com/app/python/venv-switch/

## 環境の再現

ksuzuki内の各ディレクトリに入って以下を実行

```
python3.8 -m venv .venv38
source .venv38/bin/activate
pip install -r requirements.txt
```

## 実行方法

- train

```
python logreg_train.py dataset_train.csv
```

- predict

```
python logreg_predict.py dataset_test.csv
```
